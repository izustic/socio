import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import {
  Check,
  BadgeCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Heart,
  Infinity,
  LockKeyhole,
  RefreshCw,
  RotateCcw,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Radius, Spacing, Typography } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { useSwipeTabVisibility } from "@/src/context/SwipeTabVisibilityContext";
import { getIncomingLikes, IncomingLike } from "@/src/services/likes";
import { submitCircleSwipe, submitSwipe } from "@/src/services/swipe";
import {
  getProducts,
  hasSocioPlusAccess,
  initBilling,
  purchaseSocioPlus,
  restorePurchases,
  SocioPlusProduct,
} from "@/src/services/billing";

const placeholderImage = require("@/assets/images/circle-placeholder.png");

type SocioPlan = "yearly" | "monthly";
type PaywallMode = "plans" | "active";

type NoticeState = {
  visible: boolean;
  title: string;
  message: string;
};

const SOCIO_PLUS_FEATURES = [
  {
    title: "Bigger Circles",
    subtitle: "Up to 8 members instead of 5",
    Icon: Users,
  },
  {
    title: "All filters",
    subtitle: "Traits, education, recently active",
    Icon: SlidersHorizontal,
  },
  {
    title: "Unlimited swipes",
    subtitle: "No daily cap",
    Icon: Infinity,
  },
  {
    title: "Unlimited extensions",
    subtitle: "Keep your Circle alive",
    Icon: Clock,
  },
  {
    title: "Unlimited backtracks",
    subtitle: "Undo any swipe",
    Icon: RotateCcw,
  },
  {
    title: "Spotlight",
    subtitle: "2x per week · 1 hr each",
    Icon: Zap,
  },
  {
    title: "See who liked you",
    subtitle: "Full names + photos",
    Icon: Eye,
  },
  {
    title: "Premium badge",
    subtitle: "Stand out on your profile",
    Icon: BadgeCheck,
  },
  {
    title: "Circle analytics",
    subtitle: "Hosts only",
    Icon: BarChart3,
  },
];

const ACTIVE_TOOLS = [
  {
    title: "Use a Spotlight",
    subtitle: "2 left this week",
    Icon: Zap,
  },
  {
    title: "Circle analytics",
    subtitle: "Host insights",
    Icon: BarChart3,
  },
  {
    title: "Premium badge",
    subtitle: "Showing on profile",
    Icon: BadgeCheck,
  },
  {
    title: "Manage subscription",
    subtitle: "Yearly · renews Jul 6",
    Icon: Settings,
  },
];

const formatRenewalDate = (plan: SocioPlan) => {
  const renewalDate = new Date();
  if (plan === "yearly") {
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
  } else {
    renewalDate.setMonth(renewalDate.getMonth() + 1);
  }

  return renewalDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const getLikeImage = (item: IncomingLike) => {
  if (item.type === "profile") {
    return (
      item.profile.photoURL ||
      item.profile.media?.find((media) => media.remoteUrl || media.uri)
        ?.remoteUrl ||
      item.profile.media?.find((media) => media.remoteUrl || media.uri)?.uri
    );
  }

  return item.circle.imageUrl;
};

const getLikeTitle = (item: IncomingLike) => {
  if (item.type === "profile") {
    const age = item.profile.age ? `, ${item.profile.age}` : "";
    return `${item.profile.name || "Someone"}${age}`;
  }

  return item.circle.name;
};

const getLikeSubtitle = (item: IncomingLike) => {
  if (item.type === "profile") {
    const interests = item.profile.interests?.slice(0, 2).join(" · ");
    return interests || item.profile.bio || "Liked your Circle";
  }

  const interests = item.circle.filters.interests?.slice(0, 2).join(" · ");
  return interests || item.circle.meetupGoal || "Liked your profile";
};

export default function LikesScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { refreshSwipeTabVisibility } = useSwipeTabVisibility();
  const [likes, setLikes] = useState<IncomingLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallMode, setPaywallMode] = useState<PaywallMode>("plans");
  const [selectedPlan, setSelectedPlan] = useState<SocioPlan>("monthly");
  const [processingPlan, setProcessingPlan] = useState<SocioPlan | null>(null);
  const [products, setProducts] = useState<SocioPlusProduct[]>([]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeState>({
    visible: false,
    title: "",
    message: "",
  });
  const isSocioPlus = hasSocioPlusAccess(profile);
  const monthlyProduct = products[0] ?? null;

  const visibleLikes = useMemo(() => likes, [likes]);

  const loadLikes = useCallback(
    async (showRefresh = false) => {
      if (!user) {
        setLikes([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const incomingLikes = await getIncomingLikes(user.id, profile);
      setLikes(incomingLikes);
      setLoading(false);
      setRefreshing(false);
    },
    [profile, user],
  );

  useEffect(() => {
    void loadLikes();
  }, [loadLikes]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let active = true;

    const setupBilling = async () => {
      try {
        cleanup = await initBilling({
          onPurchaseVerified: async () => {
            await refreshProfile();
            if (active) {
              setPaywallMode("active");
              setProcessingPlan(null);
            }
          },
          onPurchasePending: () => {
            if (active) {
              setProcessingPlan(null);
              setNotice({
                visible: true,
                title: "Purchase pending",
                message:
                  "Your purchase is pending approval. Socio+ will unlock after the store confirms payment.",
              });
            }
          },
          onPurchaseError: (message) => {
            if (active) {
              setProcessingPlan(null);
              setNotice({
                visible: true,
                title: "Purchase not completed",
                message,
              });
            }
          },
        });

        const storeProducts = await getProducts();
        if (active) setProducts(storeProducts);
      } catch (error) {
        console.error("Error setting up billing:", error);
      }
    };

    void setupBilling();

    return () => {
      active = false;
      cleanup?.();
    };
  }, [refreshProfile]);

  const handleUpgradePress = () => {
    setPaywallMode(isSocioPlus ? "active" : "plans");
    setPaywallVisible(true);
  };

  const handlePlanPress = async (plan: SocioPlan) => {
    if (!user || processingPlan) return;
    if (plan === "yearly") {
      setSelectedPlan(plan);
      setNotice({
        visible: true,
        title: "Yearly is coming soon",
        message:
          "The store product configured right now is Socio+ monthly. Add a yearly product ID in App Store Connect and Google Play to enable this plan.",
      });
      return;
    }
    if (!monthlyProduct) {
      setNotice({
        visible: true,
        title: "Price unavailable",
        message:
          "We could not load Socio+ from the store yet. Please try again in a moment.",
      });
      return;
    }

    setSelectedPlan(plan);
    setProcessingPlan(plan);

    try {
      const result = await purchaseSocioPlus(monthlyProduct);
      if (result === "pending") return;
      await refreshProfile();
      setPaywallMode("active");
    } catch (error) {
      console.error("Error activating Socio+:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Please try again. You were not charged if the store did not complete the purchase.";

      if (message.toLowerCase().includes("already own")) {
        await handleRestorePurchases();
        return;
      }

      setNotice({
        visible: true,
        title: "Could not activate Socio+",
        message,
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleRestorePurchases = async () => {
    if (billingLoading) return;

    setBillingLoading(true);
    try {
      await restorePurchases();
      await refreshProfile();
      setPaywallMode("active");
    } catch (error) {
      setNotice({
        visible: true,
        title: "Nothing to restore",
        message:
          error instanceof Error
            ? error.message
            : "We could not find an active Socio+ subscription for this store account.",
      });
    } finally {
      setBillingLoading(false);
    }
  };

  const handleSwipeBack = async (item: IncomingLike, liked: boolean) => {
    if (!user || !isSocioPlus || actingId) return;

    setActingId(item.id);
    const previousLikes = likes;
    setLikes((current) => current.filter((like) => like.id !== item.id));

    try {
      if (item.type === "profile") {
        await submitSwipe(item.circleId, user.id, item.profile.uid, liked);
      } else {
        await submitCircleSwipe(item.circle.id, user.id, liked);
      }

      await refreshSwipeTabVisibility({ silent: true });
    } catch (error) {
      console.error("Error responding to incoming like:", error);
      setLikes(previousLikes);
      setNotice({
        visible: true,
        title: "Could not respond",
        message: "Please try again.",
      });
    } finally {
      setActingId(null);
    }
  };

  const renderLike: ListRenderItem<IncomingLike> = ({ item }) => (
    <LikeTile
      item={item}
      locked={!isSocioPlus}
      disabled={Boolean(actingId)}
      onPass={() => handleSwipeBack(item, false)}
      onLike={() => handleSwipeBack(item, true)}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your likes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <FlatList
          data={visibleLikes}
          keyExtractor={(item) => item.id}
          renderItem={renderLike}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => void loadLikes(true)}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={styles.screenTitle}>Likes you</Text>
                <TouchableOpacity
                  activeOpacity={0.82}
                  style={styles.plusPill}
                  onPress={handleUpgradePress}
                >
                  <Sparkles size={15} color={Colors.textPrimary} strokeWidth={2.3} />
                  <Text style={styles.plusText}>SOCIO+</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.countRow}>
                <Heart
                  size={28}
                  color={Colors.primary}
                  fill={Colors.primary}
                  strokeWidth={2.4}
                />
                <Text style={styles.countText}>
                  {likes.length} {likes.length === 1 ? "like" : "likes"} you
                </Text>
              </View>
              <Text style={styles.subtitle}>
                {isSocioPlus
                  ? "Swipe back to fast-track a match."
                  : "Unlock to see who and swipe back to form a Circle faster."}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Sparkles size={34} color={Colors.primaryDark} strokeWidth={2.2} />
              <Text style={styles.emptyTitle}>No likes yet</Text>
              <Text style={styles.emptyText}>
                Likes from people and Circles will appear here.
              </Text>
            </View>
          }
          ListFooterComponent={
            !isSocioPlus && likes.length > 0 ? (
              <View style={styles.footerUpsell}>
                <View style={styles.upsellCard}>
                  <View style={styles.upsellIcon}>
                    <Sparkles size={24} color={Colors.textPrimary} strokeWidth={2.3} />
                  </View>
                  <View style={styles.upsellCopy}>
                    <Text style={styles.upsellTitle}>See everyone with Socio+</Text>
                    <Text style={styles.upsellText}>From $4.17/month</Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.88}
                  style={styles.upgradeButton}
                  onPress={handleUpgradePress}
                >
                  <Sparkles size={20} color={Colors.textPrimary} strokeWidth={2.4} />
                  <Text style={styles.upgradeText}>Unlock with Socio+</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      </SafeAreaView>

      <SocioPlusPaywall
        visible={paywallVisible}
        mode={paywallMode}
        selectedPlan={selectedPlan}
        processingPlan={processingPlan}
        monthlyProduct={monthlyProduct}
        billingLoading={billingLoading}
        onClose={() => setPaywallVisible(false)}
        onBackToPlans={() => setPaywallMode("plans")}
        onSelectPlan={handlePlanPress}
        onRestore={handleRestorePurchases}
      />
      <NoticeModal
        visible={notice.visible}
        title={notice.title}
        message={notice.message}
        onClose={() => setNotice((current) => ({ ...current, visible: false }))}
      />
    </>
  );
}

function SocioPlusPaywall({
  visible,
  mode,
  selectedPlan,
  processingPlan,
  monthlyProduct,
  billingLoading,
  onClose,
  onBackToPlans,
  onSelectPlan,
  onRestore,
}: {
  visible: boolean;
  mode: PaywallMode;
  selectedPlan: SocioPlan;
  processingPlan: SocioPlan | null;
  monthlyProduct: SocioPlusProduct | null;
  billingLoading: boolean;
  onClose: () => void;
  onBackToPlans: () => void;
  onSelectPlan: (plan: SocioPlan) => void;
  onRestore: () => void;
}) {
  if (mode === "active") {
    return (
      <Modal
        animationType="slide"
        visible={visible}
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <SocioPlusActiveScreen
          selectedPlan={selectedPlan}
          product={monthlyProduct}
          onBack={onBackToPlans}
        />
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      visible={visible}
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.paywallContainer}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.paywallTopBar}>
          <TouchableOpacity
            activeOpacity={0.78}
            style={styles.paywallClose}
            onPress={onClose}
          >
            <X size={22} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
          <Text style={styles.paywallKicker}>SOCIO+</Text>
          <View style={styles.paywallTopSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.paywallContent}
        >
          <View style={styles.paywallHeroIcon}>
            <Sparkles size={38} color={Colors.textPrimary} strokeWidth={2.2} />
          </View>
          <Text style={styles.paywallTitle}>Build the Circle you actually want.</Text>
          <Text style={styles.paywallSubtitle}>
            Unlock bigger groups, every filter, and the tools hosts love.
          </Text>

          <View style={styles.featureList}>
            {SOCIO_PLUS_FEATURES.map(({ title, subtitle, Icon }) => (
              <View key={title} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Icon size={22} color={Colors.textPrimary} strokeWidth={2.3} />
                </View>
                <View style={styles.featureCopy}>
                  <Text style={styles.featureTitle}>{title}</Text>
                  <Text style={styles.featureSubtitle}>{subtitle}</Text>
                </View>
                <Check size={22} color={Colors.textSecondary} strokeWidth={2.1} />
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.planSheet}>
          <TouchableOpacity
            activeOpacity={0.88}
            disabled
            style={[
              styles.planCard,
              styles.disabledPlan,
              selectedPlan === "yearly" && styles.selectedPlan,
            ]}
            onPress={() => onSelectPlan("yearly")}
          >
            <View>
              <Text style={styles.planTitle}>Yearly</Text>
              <Text style={styles.planMeta}>Coming soon</Text>
            </View>
            <View style={styles.planPriceWrap}>
              <Text style={styles.planPrice}>—</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            disabled={Boolean(processingPlan)}
            style={[
              styles.planCard,
              styles.monthlyPlan,
              selectedPlan === "monthly" && styles.selectedPlan,
            ]}
            onPress={() => onSelectPlan("monthly")}
          >
            <View>
              <Text style={styles.planTitle}>Monthly</Text>
              <Text style={styles.planMeta}>
                {monthlyProduct?.billingPeriod
                  ? `Billed every ${monthlyProduct.billingPeriod}`
                  : "Loading store price"}
              </Text>
            </View>
            {processingPlan === "monthly" ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.monthlyPrice}>
                {monthlyProduct?.localizedPrice || "—"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.78}
            style={styles.restoreButton}
            disabled={billingLoading}
            onPress={onRestore}
          >
            {billingLoading ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text style={styles.restoreText}>Restore Purchase</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.renewalText}>Auto-renews. Cancel anytime in settings.</Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function SocioPlusActiveScreen({
  selectedPlan,
  product,
  onBack,
}: {
  selectedPlan: SocioPlan;
  product: SocioPlusProduct | null;
  onBack: () => void;
}) {
  const planLabel = selectedPlan === "yearly" ? "Yearly" : "Monthly";
  const planPrice = product?.localizedPrice || "Active";
  const renewalDate = formatRenewalDate(selectedPlan);

  return (
    <SafeAreaView style={styles.activeContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.activeTopBar}>
        <TouchableOpacity
          activeOpacity={0.78}
          style={styles.activeBackButton}
          onPress={onBack}
        >
          <ChevronLeft size={24} color={Colors.textPrimary} strokeWidth={2.3} />
        </TouchableOpacity>
        <Text style={styles.activeKicker}>Socio+</Text>
        <View style={styles.activeTopSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.activeContent}
      >
        <View style={styles.activeHero}>
          <View style={styles.activeStatusRow}>
            <Sparkles size={21} color={Colors.textPrimary} strokeWidth={2.3} />
            <Text style={styles.activeStatusText}>ACTIVE</Text>
          </View>
          <Text style={styles.activeTitle}>You&apos;re on Socio+</Text>
          <Text style={styles.activeSubtitle}>
            {planLabel} plan · {planPrice} · renews {renewalDate}
          </Text>

          <View style={styles.activeStatsRow}>
            <View style={styles.activeStatCard}>
              <Infinity size={25} color={Colors.textPrimary} strokeWidth={2.4} />
              <Text style={styles.activeStatText}>Swipes</Text>
            </View>
            <View style={styles.activeStatCard}>
              <Text style={styles.activeStatNumber}>2</Text>
              <Text style={styles.activeStatText}>Spotlights</Text>
            </View>
            <View style={styles.activeStatCard}>
              <Text style={styles.activeStatNumber}>8</Text>
              <Text style={styles.activeStatText}>Circle size</Text>
            </View>
          </View>
        </View>

        <Text style={styles.toolsLabel}>PREMIUM TOOLS</Text>
        <View style={styles.toolsCard}>
          {ACTIVE_TOOLS.map(({ title, subtitle, Icon }, index) => (
            <TouchableOpacity
              key={title}
              activeOpacity={0.78}
              style={[
                styles.toolRow,
                index < ACTIVE_TOOLS.length - 1 && styles.toolDivider,
              ]}
              onPress={() => {
                if (title === "Manage subscription") {
                  onBack();
                }
              }}
            >
              <Icon size={23} color={Colors.textPrimary} strokeWidth={2.1} />
              <View style={styles.toolCopy}>
                <Text style={styles.toolTitle}>{title}</Text>
                <Text style={styles.toolSubtitle}>
                  {title === "Manage subscription"
                    ? `${planLabel} · renews ${renewalDate}`
                    : subtitle}
                </Text>
              </View>
              <ChevronRight size={22} color={Colors.textSecondary} strokeWidth={2.1} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NoticeModal({
  visible,
  title,
  message,
  onClose,
}: {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.noticeBackdrop}>
        <View style={styles.noticeCard}>
          <View style={styles.noticeIcon}>
            <Sparkles size={24} color={Colors.textPrimary} strokeWidth={2.3} />
          </View>
          <Text style={styles.noticeTitle}>{title}</Text>
          <Text style={styles.noticeMessage}>{message}</Text>
          <TouchableOpacity
            activeOpacity={0.86}
            style={styles.noticeButton}
            onPress={onClose}
          >
            <Text style={styles.noticeButtonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function LikeTile({
  item,
  locked,
  disabled,
  onPass,
  onLike,
}: {
  item: IncomingLike;
  locked: boolean;
  disabled: boolean;
  onPass: () => void;
  onLike: () => void;
}) {
  const imageUri = getLikeImage(item);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          !locked &&
          !disabled &&
          Math.abs(gestureState.dx) > 10 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx > 56) {
            onLike();
            return;
          }

          if (gestureState.dx < -56) {
            onPass();
          }
        },
      }),
    [disabled, locked, onLike, onPass],
  );

  return (
    <View style={styles.tile} {...(!locked ? panResponder.panHandlers : {})}>
      <Image
        source={imageUri ? { uri: imageUri } : placeholderImage}
        style={styles.tileImage}
        contentFit="cover"
      />
      <View style={styles.tileShade} />

      {locked ? (
        <>
          <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
          <View style={styles.lockedLabel}>
            <LockKeyhole size={14} color={Colors.textPrimary} strokeWidth={2.1} />
            <Text style={styles.lockedText}>Hidden</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.tileCopy}>
            <Text style={styles.tileTitle} numberOfLines={1}>
              {getLikeTitle(item)}
            </Text>
            <Text style={styles.tileSubtitle} numberOfLines={1}>
              {getLikeSubtitle(item)}
            </Text>
          </View>
          <View style={styles.actionRow}>
            <Pressable
              disabled={disabled}
              style={[styles.actionButton, disabled && styles.disabledAction]}
              onPress={onPass}
            >
              <X size={18} color={Colors.textPrimary} strokeWidth={2.5} />
            </Pressable>
            <Pressable
              disabled={disabled}
              style={[
                styles.actionButton,
                styles.likeButton,
                disabled && styles.disabledAction,
              ]}
              onPress={onLike}
            >
              {disabled ? (
                <RefreshCw size={17} color={Colors.textPrimary} strokeWidth={2.3} />
              ) : (
                <Check size={18} color={Colors.textPrimary} strokeWidth={2.5} />
              )}
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 18,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    ...Typography.h2,
    fontSize: 26,
    lineHeight: 32,
  },
  plusPill: {
    minHeight: 34,
    paddingHorizontal: 13,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  plusText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 26,
  },
  countText: {
    ...Typography.h1,
    fontSize: 32,
    lineHeight: 38,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 8,
    maxWidth: 360,
  },
  gridRow: {
    gap: 16,
    marginBottom: 16,
  },
  tile: {
    flex: 1,
    maxWidth: "47.8%",
    aspectRatio: 0.75,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    overflow: "hidden",
  },
  tileImage: {
    ...StyleSheet.absoluteFillObject,
  },
  tileShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  lockedLabel: {
    position: "absolute",
    left: 12,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  lockedText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  tileCopy: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 58,
  },
  tileTitle: {
    ...Typography.h3,
    color: Colors.white,
    fontWeight: "800",
  },
  tileSubtitle: {
    ...Typography.bodySmall,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  actionRow: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  likeButton: {
    backgroundColor: Colors.primary,
  },
  disabledAction: {
    opacity: 0.55,
  },
  emptyState: {
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    marginTop: 14,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },
  footerUpsell: {
    gap: 16,
    paddingTop: 10,
  },
  upsellCard: {
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  upsellIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  upsellCopy: {
    flex: 1,
  },
  upsellTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  upsellText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  upgradeButton: {
    minHeight: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  upgradeText: {
    ...Typography.button,
    color: Colors.textPrimary,
    fontSize: 19,
  },
  paywallContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  paywallTopBar: {
    minHeight: 62,
    paddingHorizontal: Spacing.screenPadding,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  paywallClose: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  paywallKicker: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  paywallTopSpacer: {
    width: 48,
  },
  paywallContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 24,
    paddingBottom: 278,
  },
  paywallHeroIcon: {
    width: 74,
    height: 74,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  paywallTitle: {
    ...Typography.h1,
    fontSize: 36,
    lineHeight: 40,
    maxWidth: 360,
  },
  paywallSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 17,
    lineHeight: 25,
    marginTop: 16,
    maxWidth: 386,
  },
  featureList: {
    gap: 14,
    marginTop: 24,
  },
  featureRow: {
    minHeight: 82,
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 14,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.h3,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
  },
  featureSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  planSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 22,
    gap: 12,
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.divider,
  },
  planCard: {
    minHeight: 90,
    borderRadius: 18,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  yearlyPlan: {
    backgroundColor: Colors.primary,
  },
  disabledPlan: {
    backgroundColor: Colors.inputBg,
    opacity: 0.62,
  },
  monthlyPlan: {
    backgroundColor: Colors.inputBg,
  },
  selectedPlan: {
    borderWidth: 2,
    borderColor: Colors.textPrimary,
  },
  planTitle: {
    ...Typography.h3,
    fontSize: 18,
    fontWeight: "800",
  },
  planMeta: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    marginTop: 5,
  },
  planPriceWrap: {
    alignItems: "flex-end",
  },
  planPrice: {
    ...Typography.h2,
    fontSize: 26,
    fontWeight: "800",
  },
  planUnit: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  monthlyPrice: {
    ...Typography.h2,
    fontSize: 26,
    fontWeight: "800",
  },
  renewalText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
  },
  restoreButton: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  restoreText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  noticeBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.26)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.screenPadding,
  },
  noticeCard: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: Colors.white,
    padding: 24,
    alignItems: "center",
  },
  noticeIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  noticeTitle: {
    ...Typography.h2,
    textAlign: "center",
  },
  noticeMessage: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 10,
  },
  noticeButton: {
    minHeight: 52,
    alignSelf: "stretch",
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  noticeButtonText: {
    ...Typography.button,
    color: Colors.textPrimary,
  },
  activeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  activeTopBar: {
    minHeight: 70,
    paddingHorizontal: Spacing.screenPadding,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeBackButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.inputBg,
    alignItems: "center",
    justifyContent: "center",
  },
  activeKicker: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 17,
    fontWeight: "700",
  },
  activeTopSpacer: {
    width: 54,
  },
  activeContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 32,
    paddingBottom: 60,
  },
  activeHero: {
    borderRadius: 28,
    backgroundColor: Colors.primary,
    padding: 28,
  },
  activeStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  activeStatusText: {
    ...Typography.label,
    color: Colors.textPrimary,
    fontWeight: "900",
    fontSize: 15,
  },
  activeTitle: {
    ...Typography.h1,
    fontSize: 32,
    lineHeight: 38,
    marginTop: 22,
  },
  activeSubtitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 16,
    marginTop: 8,
  },
  activeStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  activeStatCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 13,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  activeStatNumber: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "900",
  },
  activeStatText: {
    ...Typography.bodySmall,
    color: Colors.textPrimary,
  },
  toolsLabel: {
    ...Typography.label,
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 34,
    marginBottom: 18,
  },
  toolsCard: {
    borderRadius: 18,
    backgroundColor: Colors.inputBg,
    overflow: "hidden",
  },
  toolRow: {
    minHeight: 88,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  toolDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  toolCopy: {
    flex: 1,
  },
  toolTitle: {
    ...Typography.h3,
    fontSize: 19,
    lineHeight: 23,
  },
  toolSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
