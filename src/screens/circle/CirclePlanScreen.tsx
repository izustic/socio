import Avatar from "@/src/components/ui/Avatar";
import Button from "@/src/components/ui/Button";
import LocationPickerModal, { type PickedEventLocation } from "@/src/components/circle/LocationPickerModal";
import { Colors, Radius, Spacing, Typography, createThemedStyles } from "@/src/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { getCircle, getLatestCircleForParticipant } from "@/src/services/circle";
import {
  MeetupCategory,
  MeetupExperience,
  MeetupPlan,
  createInitialMeetupPlan,
  getMeetupStepForMember,
  loadMeetupPlan,
  saveMeetupPlan,
} from "@/src/services/meetupPlanning";
import { SwipeCandidate, getUsersByIds } from "@/src/services/swipe";
import { Circle } from "@/src/types";
import { router, useLocalSearchParams } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  ExternalLink,
  Gamepad2,
  MapPin,
  Music2,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Ticket,
  TreePine,
  Trophy,
  Utensils,
  Users,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES: MeetupCategory[] = ["All", "Food", "Games", "Sports", "Music", "Outdoors"];
const categoryIcons = {
  All: Sparkles,
  Food: Utensils,
  Games: Gamepad2,
  Sports: Trophy,
  Music: Music2,
  Outdoors: TreePine,
};

const stageNumber = (step: MeetupPlan["step"]) =>
  step === "time" ? 1 : step === "experience" ? 2 : step === "review" ? 3 : 4;

const getExpiry = () => {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
};

export default function CirclePlanScreen() {
  const { user, profile } = useAuth();
  const { circleId } = useLocalSearchParams<{ circleId?: string }>();
  const [circle, setCircle] = useState<Circle | null>(null);
  const [members, setMembers] = useState<SwipeCandidate[]>([]);
  const [plan, setPlan] = useState<MeetupPlan>(createInitialMeetupPlan());
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<MeetupCategory>("All");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<MeetupExperience | null>(null);
  const [creating, setCreating] = useState(false);
  const [addingTime, setAddingTime] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!user) return;
      const found = circleId
        ? await getCircle(String(circleId))
        : await getLatestCircleForParticipant(user.id);
      if (!active) return;
      setCircle(found);
      if (found) {
        const [storedPlan, profiles] = await Promise.all([
          loadMeetupPlan(found.id),
          getUsersByIds(found.members),
        ]);
        if (!active) return;
        const byId = new Map(profiles.map((profile) => [profile.uid, profile]));
        setMembers(found.members.map((id) => byId.get(id)).filter(Boolean) as SwipeCandidate[]);
        setPlan({
          ...storedPlan,
          step: getMeetupStepForMember(
            storedPlan,
            user.id,
            found.members.length,
          ),
        });
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [circleId, user]);

  const updatePlan = (updater: (current: MeetupPlan) => MeetupPlan) => {
    setPlan((current) => {
      const next = updater(current);
      if (circle) void saveMeetupPlan(circle.id, next);
      return next;
    });
  };

  const currentUserId = user?.id ?? "current-user";
  const selectedTime = plan.timeOptions.find((option) => option.id === plan.selectedTimeId);
  const selectedExperience = plan.experiences.find((event) => event.id === plan.selectedExperienceId);
  const unanimousTime = Boolean(selectedTime && circle && selectedTime.votes.length >= circle.members.length);
  const eventVoteComplete = Boolean(selectedExperience && circle && selectedExperience.votes.length >= circle.members.length);

  const filteredExperiences = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return plan.experiences.filter((event) => {
      const matchesCategory = category === "All" || event.category === category;
      const matchesQuery = !needle || `${event.title} ${event.location} ${event.category}`.toLowerCase().includes(needle);
      const matchesTime = !event.availableTimeIds || !plan.selectedTimeId || event.availableTimeIds.includes(plan.selectedTimeId);
      return matchesCategory && matchesQuery && matchesTime;
    });
  }, [category, plan.experiences, plan.selectedTimeId, query]);

  const publicEventLimitReached = !profile?.isSocioPlus && plan.experiences.some((event) => {
    if (!event.isCreatedByCircle || !event.isPublic || !event.expiresAt) return false;
    return new Date(event.expiresAt).getTime() > Date.now();
  });

  const voteForTime = (optionId: string) => updatePlan((current) => ({
    ...current,
    selectedTimeId: optionId,
    timeOptions: current.timeOptions.map((option) => ({
      ...option,
      votes: option.id === optionId
        ? Array.from(new Set([...option.votes, currentUserId]))
        : option.votes.filter((id) => id !== currentUserId),
    })),
  }));

  const addCustomTime = (label: string, detail: string, dateKey: string) => {
    const id = `custom-${dateKey}-${Date.now()}`;
    updatePlan((current) => ({
      ...current,
      selectedTimeId: id,
      timeOptions: [
        ...current.timeOptions.map((option) => ({
          ...option,
          votes: option.votes.filter((memberId) => memberId !== currentUserId),
        })),
        { id, label, detail, votes: [currentUserId] },
      ],
    }));
    setAddingTime(false);
  };

  const voteForExperience = (eventId: string) => updatePlan((current) => ({
    ...current,
    selectedExperienceId: eventId,
    experiences: current.experiences.map((event) => ({
      ...event,
      votes: event.id === eventId
        ? Array.from(new Set([...event.votes, currentUserId]))
        : event.votes.filter((id) => id !== currentUserId),
    })),
  }));

  const continueFromTime = () => {
    if (!selectedTime) return;
    if (!unanimousTime) {
      Alert.alert("Waiting for everyone", "Every Circle member must vote before experiences unlock.");
      return;
    }
    updatePlan((current) => ({ ...current, step: "experience" }));
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><ActivityIndicator style={styles.loader} color={Colors.primary} /></SafeAreaView>;
  }

  if (!circle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Users size={36} color={Colors.primary} />
          <Text style={styles.title}>No active Circle</Text>
          <Text style={styles.subtitle}>Join or create a Circle before planning a meetup.</Text>
          <Button title="Back to Circle" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}><ArrowLeft size={21} color={Colors.textPrimary} /></TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Plan your meetup</Text>
          <Text style={styles.headerSubtitle}>{circle.name}</Text>
        </View>
        <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{stageNumber(plan.step)} of 4</Text></View>
      </View>

      {plan.step !== "scheduled" && (
        <View style={styles.progressTrack}>
          {[1, 2, 3, 4].map((step) => <View key={step} style={[styles.progressSegment, step <= stageNumber(plan.step) && styles.progressSegmentActive]} />)}
        </View>
      )}

      {plan.step === "time" && (
        <TimeStep
          plan={plan}
          members={members}
          memberCount={circle.members.length}
          currentUserId={currentUserId}
          onVote={voteForTime}
          onSuggest={() => setAddingTime(true)}
          onContinue={continueFromTime}
        />
      )}

      {plan.step === "experience" && (
        <ExperienceStep
          category={category}
          query={query}
          experiences={filteredExperiences}
          memberCount={circle.members.length}
          selectedTime={selectedTime}
          onCategory={setCategory}
          onQuery={setQuery}
          onCreate={() => setCreating(true)}
          onDetail={setDetail}
          onVote={voteForExperience}
          onContinue={() => {
            if (!selectedExperience) return;
            if (!eventVoteComplete) {
              Alert.alert("Waiting for everyone", "All Circle members need to vote for the experience before review.");
              return;
            }
            updatePlan((current) => ({ ...current, step: "review" }));
          }}
        />
      )}

      {plan.step === "review" && selectedTime && selectedExperience && (
        <ReviewStep
          time={`${selectedTime.label}, ${selectedTime.detail}`}
          experience={selectedExperience}
          members={members}
          confirmed={plan.confirmedMemberIds}
          currentUserId={currentUserId}
          onBack={() => updatePlan((current) => ({ ...current, step: "experience" }))}
          onConfirm={() => updatePlan((current) => ({
            ...current,
            step: "scheduled",
            confirmedMemberIds: Array.from(new Set([...current.confirmedMemberIds, currentUserId])),
          }))}
        />
      )}

      {plan.step === "scheduled" && selectedTime && selectedExperience && (
        <ScheduledStep
          time={`${selectedTime.label}, ${selectedTime.detail}`}
          experience={selectedExperience}
          members={members}
          onBook={() => selectedExperience.bookingUrl && void Linking.openURL(selectedExperience.bookingUrl)}
        />
      )}

      <EventDetailModal
        event={detail}
        selectedTime={selectedTime ? `${selectedTime.label}, ${selectedTime.detail}` : ""}
        onClose={() => setDetail(null)}
        onVote={(id) => { voteForExperience(id); setDetail(null); }}
      />
      <CustomTimeModal
        visible={addingTime}
        onClose={() => setAddingTime(false)}
        onCreate={addCustomTime}
      />
      <CreateEventModal
        visible={creating}
        selectedTime={selectedTime ? `${selectedTime.label}, ${selectedTime.detail}` : ""}
        selectedTimeId={selectedTime?.id}
        publicEventLimitReached={publicEventLimitReached}
        onClose={() => setCreating(false)}
        onCreate={(event) => {
          updatePlan((current) => ({
            ...current,
            experiences: [event, ...current.experiences],
            selectedExperienceId: event.id,
          }));
          setCreating(false);
        }}
      />
    </SafeAreaView>
  );
}

function TimeStep({ plan, members, memberCount, currentUserId, onVote, onSuggest, onContinue }: {
  plan: MeetupPlan; members: SwipeCandidate[]; memberCount: number; currentUserId: string;
  onVote: (id: string) => void; onSuggest: () => void; onContinue: () => void;
}) {
  const selected = plan.timeOptions.find((option) => option.id === plan.selectedTimeId);
  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>STEP 1 · TIME</Text>
        <Text style={styles.title}>When works for everyone?</Text>
        <Text style={styles.subtitle}>Pick one option. The next step unlocks when every member has voted.</Text>
        <View style={styles.cardList}>
          {plan.timeOptions.map((option) => {
            const selectedOption = option.id === plan.selectedTimeId;
            const voted = option.votes.includes(currentUserId);
            return (
              <TouchableOpacity key={option.id} style={[styles.optionCard, selectedOption && styles.selectedCard]} onPress={() => onVote(option.id)}>
                <View style={styles.tintIcon}><CalendarDays size={21} color={Colors.primaryDark} /></View>
                <View style={styles.optionCopy}><Text style={styles.optionTitle}>{option.label}</Text><Text style={styles.optionMeta}>{option.detail}</Text></View>
                <Text style={styles.voteCount}>{option.votes.length} / {memberCount}</Text>
                <View style={[styles.radio, voted && styles.radioSelected]}>{voted && <Check size={14} color={Colors.inverseText} />}</View>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity style={styles.addOption} onPress={onSuggest}><Plus size={18} color={Colors.textPrimary} /><Text style={styles.addOptionText}>Suggest another time</Text></TouchableOpacity>
        <View style={styles.waitingCard}>
          <Clock3 size={20} color={Colors.primaryDark} />
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{selected ? `${selected.votes.length} of ${memberCount} voted` : "Choose your time"}</Text>
            <Text style={styles.optionMeta}>{selected && selected.votes.length < memberCount ? `Waiting for ${memberCount - selected.votes.length} member${memberCount - selected.votes.length === 1 ? "" : "s"}` : selected ? "Everyone agrees — you can continue" : "Your vote can be changed until everyone agrees"}</Text>
          </View>
          <View style={styles.avatarStack}>{members.slice(0, 3).map((member, index) => <View key={member.uid} style={[styles.miniAvatar, { marginLeft: index ? -8 : 0 }]}><Avatar size={28} uri={member.photoURL || undefined} placeholder={!member.photoURL} /></View>)}</View>
        </View>
      </ScrollView>
      <View style={styles.footer}><Button title="Choose an experience" disabled={!selected} onPress={onContinue} /></View>
    </View>
  );
}

function CustomTimeModal({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (label: string, detail: string, dateKey: string) => void;
}) {
  const today = useMemo(() => {
    const value = new Date();
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }, []);
  const latest = useMemo(() => {
    const value = new Date(today);
    value.setDate(value.getDate() + 30);
    return value;
  }, [today]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [hour, setHour] = useState("6");
  const [minute, setMinute] = useState("30");
  const [period, setPeriod] = useState("PM");

  const calendarDays = useMemo(() => {
    const firstWeekday = visibleMonth.getDay();
    const daysInMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + 1,
      0,
    ).getDate();
    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from(
        { length: daysInMonth },
        (_, index) => new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index + 1),
      ),
    ];
  }, [visibleMonth]);

  const shiftMonth = (amount: number) => {
    setVisibleMonth((current) =>
      new Date(current.getFullYear(), current.getMonth() + amount, 1),
    );
  };

  const firstAllowedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastAllowedMonth = new Date(latest.getFullYear(), latest.getMonth(), 1);
  const canGoBack = visibleMonth.getTime() > firstAllowedMonth.getTime();
  const canGoForward = visibleMonth.getTime() < lastAllowedMonth.getTime();

  const submit = () => {
    if (!selectedDate) {
      Alert.alert("Choose a date", "Select a day from the calendar.");
      return;
    }

    const label = selectedDate.toLocaleDateString(undefined, {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    onCreate(label, `${hour}:${minute} ${period}`, dateKey);
    setSelectedDate(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalPage}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.iconButton} onPress={onClose}>
            <X size={21} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Suggest a time</Text>
            <Text style={styles.headerSubtitle}>Everyone will vote on this option</Text>
          </View>
          <View style={styles.iconButton} />
        </View>
        <ScrollView contentContainerStyle={styles.modalContent}>
          <View style={styles.customTimeHero}>
            <CalendarDays size={34} color={Colors.primaryDark} />
            <Text style={styles.optionTitle}>Add another date and time</Text>
            <Text style={styles.optionMeta}>Suggestions must be within the next 30 days.</Text>
          </View>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity style={styles.calendarArrow} disabled={!canGoBack} onPress={() => shiftMonth(-1)}>
                <ChevronLeft size={20} color={canGoBack ? Colors.textPrimary : Colors.textDisabled} />
              </TouchableOpacity>
              <Text style={styles.calendarMonth}>
                {visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
              </Text>
              <TouchableOpacity style={styles.calendarArrow} disabled={!canGoForward} onPress={() => shiftMonth(1)}>
                <ChevronRight size={20} color={canGoForward ? Colors.textPrimary : Colors.textDisabled} />
              </TouchableOpacity>
            </View>
            <View style={styles.weekRow}>
              {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <Text key={`${day}-${index}`} style={styles.weekday}>{day}</Text>)}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => {
                if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
                const disabled = day < today || day > latest;
                const selected = selectedDate?.toDateString() === day.toDateString();
                const isToday = today.toDateString() === day.toDateString();
                return (
                  <TouchableOpacity key={day.toISOString()} style={styles.dayCell} disabled={disabled} onPress={() => setSelectedDate(day)}>
                    <View style={[styles.dayCircle, selected && styles.dayCircleSelected, isToday && !selected && styles.dayCircleToday]}>
                      <Text style={[styles.dayText, disabled && styles.dayTextDisabled, selected && styles.dayTextSelected]}>{day.getDate()}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <Text style={styles.timePickerLabel}>CHOOSE A TIME</Text>
          <View style={styles.timePickerRow}>
            <WheelPicker label="Hour" items={Array.from({ length: 12 }, (_, index) => String(index + 1))} value={hour} onChange={setHour} />
            <Text style={styles.timeSeparator}>:</Text>
            <WheelPicker label="Minute" items={Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"))} value={minute} onChange={setMinute} />
            <WheelPicker label="" items={["AM", "PM"]} value={period} onChange={setPeriod} />
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button title="Add time option" onPress={submit} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function WheelPicker({ label, items, value, onChange }: {
  label: string;
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const rowHeight = 44;
  const selectedIndex = Math.max(0, items.indexOf(value));
  return (
    <View style={styles.wheelColumn}>
      <Text style={styles.wheelLabel}>{label}</Text>
      <View style={styles.wheelWindow}>
        <View pointerEvents="none" style={styles.wheelSelection} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          snapToInterval={rowHeight}
          decelerationRate="fast"
          contentOffset={{ x: 0, y: selectedIndex * rowHeight }}
          contentContainerStyle={styles.wheelContent}
          onMomentumScrollEnd={(event) => {
            const index = Math.max(0, Math.min(items.length - 1, Math.round(event.nativeEvent.contentOffset.y / rowHeight)));
            onChange(items[index]);
          }}
        >
          {items.map((item) => <TouchableOpacity key={item} style={styles.wheelItem} onPress={() => onChange(item)}><Text style={[styles.wheelText, item === value && styles.wheelTextSelected]}>{item}</Text></TouchableOpacity>)}
        </ScrollView>
      </View>
    </View>
  );
}

function ExperienceStep(props: {
  category: MeetupCategory; query: string; experiences: MeetupExperience[]; memberCount: number;
  selectedTime?: { label: string; detail: string }; onCategory: (value: MeetupCategory) => void;
  onQuery: (value: string) => void; onCreate: () => void; onDetail: (event: MeetupExperience) => void;
  onVote: (id: string) => void; onContinue: () => void;
}) {
  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionTitleRow}><View style={styles.optionCopy}><Text style={styles.eyebrow}>STEP 2 · EXPERIENCE</Text><Text style={styles.title}>Pick a place</Text></View><TouchableOpacity style={styles.createLink} onPress={props.onCreate}><Plus size={16} color={Colors.primaryDark} /><Text style={styles.createLinkText}>Create event</Text></TouchableOpacity></View>
        <Text style={styles.subtitle}>Showing experiences available {props.selectedTime ? `${props.selectedTime.label} at ${props.selectedTime.detail}` : "at your chosen time"}.</Text>
        <View style={styles.searchBar}><Search size={19} color={Colors.textSecondary} /><TextInput value={props.query} onChangeText={props.onQuery} placeholder="Search events, places or categories" placeholderTextColor={Colors.textDisabled} style={styles.searchInput} /><SlidersHorizontal size={19} color={Colors.textSecondary} /></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
          {CATEGORIES.map((item) => {
            const Icon = categoryIcons[item];
            const active = props.category === item;
            return <TouchableOpacity key={item} style={[styles.categoryChip, active && styles.categoryChipActive]} onPress={() => props.onCategory(item)}><Icon size={16} color={active ? Colors.inverseText : Colors.textSecondary} /><Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item}</Text></TouchableOpacity>;
          })}
        </ScrollView>
        <View style={styles.recommendationRow}><Text style={styles.listHeading}>Recommended for your Circle</Text><Text style={styles.timeFit}>Time matched</Text></View>
        {props.experiences.map((event) => <ExperienceCard key={event.id} event={event} memberCount={props.memberCount} onPress={() => props.onDetail(event)} onVote={() => props.onVote(event.id)} />)}
        {!props.experiences.length && <View style={styles.noResults}><Search size={28} color={Colors.textDisabled} /><Text style={styles.optionTitle}>No matching events</Text><Text style={styles.optionMeta}>Try another category or create your own.</Text></View>}
        <View style={styles.monetizationNote}><CircleDollarSign size={20} color={Colors.primaryDark} /><View style={styles.optionCopy}><Text style={styles.optionTitle}>For venue and event partners</Text><Text style={styles.optionMeta}>Sponsored listings are clearly labelled. Partners can pay for featured placement or share booking commission.</Text></View></View>
      </ScrollView>
      <View style={styles.footer}><Button title="Review meetup" onPress={props.onContinue} /></View>
    </View>
  );
}

function ExperienceCard({ event, memberCount, onPress, onVote }: { event: MeetupExperience; memberCount: number; onPress: () => void; onVote: () => void }) {
  const Icon = categoryIcons[event.category];
  return (
    <TouchableOpacity style={styles.eventCard} onPress={onPress}>
      <View style={styles.eventArtwork}><Icon size={28} color={Colors.primaryDark} />{event.sponsored && <View style={styles.sponsoredBadge}><Star size={10} color={Colors.primaryDark} /><Text style={styles.sponsoredText}>Sponsored</Text></View>}</View>
      <View style={styles.eventBody}><View style={styles.eventTitleRow}><Text numberOfLines={1} style={styles.eventTitle}>{event.title}</Text><ChevronRight size={18} color={Colors.textDisabled} /></View><Text style={styles.eventMeta}>{event.location}</Text><Text style={styles.eventPrice}>{event.price}</Text><View style={styles.eventFooter}><Text style={styles.fitBadge}>{event.isCreatedByCircle ? "Your event" : "Good for new Circles"}</Text><TouchableOpacity style={styles.smallVote} onPress={(e) => { e.stopPropagation(); onVote(); }}><Text style={styles.smallVoteText}>{event.votes.length ? `${event.votes.length}/${memberCount} voted` : "Vote"}</Text></TouchableOpacity></View></View>
    </TouchableOpacity>
  );
}

function ReviewStep({ time, experience, members, confirmed, currentUserId, onBack, onConfirm }: {
  time: string; experience: MeetupExperience; members: SwipeCandidate[]; confirmed: string[]; currentUserId: string; onBack: () => void; onConfirm: () => void;
}) {
  const Icon = categoryIcons[experience.category];
  return <View style={styles.flex}><ScrollView contentContainerStyle={styles.scrollContent}><Text style={styles.eyebrow}>STEP 3 · REVIEW</Text><Text style={styles.title}>Review & confirm</Text><Text style={styles.subtitle}>Double-check the plan before we notify everyone.</Text><View style={styles.reviewHero}><View style={styles.reviewHeroIcon}><Icon size={36} color={Colors.primaryDark} /></View><Text style={styles.reviewTitle}>{experience.title}</Text><Text style={styles.reviewSubtitle}>{experience.category} · {experience.price}</Text></View><View style={styles.detailCard}><DetailRow icon={Clock3} label="When" value={time} /><DetailRow icon={MapPin} label="Where" value={experience.location} /><DetailRow icon={Ticket} label="Booking" value={experience.bookingUrl ? "Required · booking link available" : "No booking required"} /><DetailRow icon={Users} label="Visibility" value={experience.isPublic ? "Public event" : "Private to your Circle"} /></View><Text style={styles.listHeading}>Circle confirmations</Text><View style={styles.confirmationRow}>{members.map((member) => { const ready = confirmed.includes(member.uid) || member.uid === currentUserId; return <View key={member.uid} style={styles.confirmationMember}><View><Avatar size={46} uri={member.photoURL || undefined} placeholder={!member.photoURL} />{ready && <View style={styles.readyDot}><Check size={10} color={Colors.inverseText} /></View>}</View><Text numberOfLines={1} style={styles.confirmationName}>{member.uid === currentUserId ? "You" : member.name.split(" ")[0]}</Text></View>; })}</View>{experience.bookingUrl && <View style={styles.bookingNotice}><Ticket size={21} color={Colors.primaryDark} /><View style={styles.optionCopy}><Text style={styles.optionTitle}>Booking required</Text><Text style={styles.optionMeta}>After confirmation, members can open the organizer booking page.</Text></View></View>}</ScrollView><View style={styles.footer}><Button title="Confirm meetup" onPress={onConfirm} /><Button title="Change experience" variant="ghost" onPress={onBack} /></View></View>;
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <View style={styles.detailRow}><View style={styles.detailIcon}><Icon size={18} color={Colors.textSecondary} /></View><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

function ScheduledStep({ time, experience, members, onBook }: { time: string; experience: MeetupExperience; members: SwipeCandidate[]; onBook: () => void }) {
  return <ScrollView contentContainerStyle={styles.scheduled}><View style={styles.successIcon}><CalendarDays size={42} color={Colors.success} /><View style={styles.successCheck}><Check size={14} color={Colors.inverseText} /></View></View><Text style={styles.scheduledTitle}>Meetup scheduled!</Text><Text style={styles.scheduledSubtitle}>Your Circle has a plan. We’ll keep the details here for everyone.</Text><View style={styles.scheduledCard}><Text style={styles.reviewTitle}>{experience.title}</Text><DetailRow icon={Clock3} label="When" value={time} /><DetailRow icon={MapPin} label="Where" value={experience.location} /></View><View style={styles.confirmationRow}>{members.map((member) => <View key={member.uid} style={styles.confirmationMember}><Avatar size={46} uri={member.photoURL || undefined} placeholder={!member.photoURL} /><Text style={styles.confirmationName}>{member.name.split(" ")[0]}</Text></View>)}</View>{experience.bookingUrl && <Button title="Open booking link" onPress={onBook} />}<Button title="Go to Circle chat" variant={experience.bookingUrl ? "outline" : "primary"} onPress={() => router.replace("/(tabs)/home?circleView=chat")} /><Text style={styles.expiryText}>Public event listings expire after 30 days.</Text></ScrollView>;
}

function EventDetailModal({ event, selectedTime, onClose, onVote }: { event: MeetupExperience | null; selectedTime: string; onClose: () => void; onVote: (id: string) => void }) {
  if (!event) return null;
  const Icon = categoryIcons[event.category];
  return <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><SafeAreaView style={styles.modalPage}><View style={styles.modalHeader}><TouchableOpacity style={styles.iconButton} onPress={onClose}><X size={21} color={Colors.textPrimary} /></TouchableOpacity><Text style={styles.headerTitle}>Event details</Text><View style={styles.iconButton} /></View><ScrollView contentContainerStyle={styles.modalContent}><View style={styles.detailArtwork}><Icon size={54} color={Colors.primaryDark} />{event.sponsored && <View style={styles.sponsoredLarge}><Star size={13} color={Colors.primaryDark} /><Text style={styles.sponsoredText}>Sponsored listing</Text></View>}</View><Text style={styles.title}>{event.title}</Text><Text style={styles.subtitle}>{event.description}</Text><View style={styles.detailCard}><DetailRow icon={CalendarDays} label="When" value={selectedTime} /><DetailRow icon={MapPin} label="Where" value={event.location} /><DetailRow icon={Ticket} label="Price" value={event.price} /><DetailRow icon={Users} label="Access" value={event.isPublic ? "Public" : "Private Circle event"} /></View>{event.bookingUrl && <TouchableOpacity style={styles.linkRow} onPress={() => void Linking.openURL(event.bookingUrl!)}><Text style={styles.linkText}>View booking page</Text><ExternalLink size={18} color={Colors.primaryDark} /></TouchableOpacity>}</ScrollView><View style={styles.footer}><Button title="Vote for this event" onPress={() => onVote(event.id)} /></View></SafeAreaView></Modal>;
}

function CreateEventModal({ visible, selectedTime, selectedTimeId, publicEventLimitReached, onClose, onCreate }: { visible: boolean; selectedTime: string; selectedTimeId?: string; publicEventLimitReached: boolean; onClose: () => void; onCreate: (event: MeetupExperience) => void }) {
  const [name, setName] = useState(""); const [location, setLocation] = useState<PickedEventLocation | null>(null); const [locationPickerVisible, setLocationPickerVisible] = useState(false); const [description, setDescription] = useState(""); const [bookingUrl, setBookingUrl] = useState(""); const [isPublic, setIsPublic] = useState(false); const [category, setCategory] = useState<Exclude<MeetupCategory, "All">>("Food");
  const submit = () => {
    if (!name.trim() || !location) { Alert.alert("Add event details", "Event name and location are required."); return; }
    if (isPublic && publicEventLimitReached) { Alert.alert("Monthly public event used", "Free members can publish one public event per month. Make this event private or upgrade to Socio Plus."); return; }
    onCreate({ id: `circle-${Date.now()}`, title: name.trim(), location: location.address, coordinates: { lat: location.lat, lng: location.lng }, description: description.trim() || "Created by this Circle.", bookingUrl: bookingUrl.trim() || undefined, category, price: "Circle organised", isPublic, isCreatedByCircle: true, expiresAt: isPublic ? getExpiry() : undefined, availableTimeIds: selectedTimeId ? [selectedTimeId] : undefined, votes: [] });
    setName(""); setLocation(null); setDescription(""); setBookingUrl(""); setIsPublic(false);
  };
  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><SafeAreaView style={styles.modalPage}><View style={styles.modalHeader}><TouchableOpacity style={styles.iconButton} onPress={onClose}><X size={21} color={Colors.textPrimary} /></TouchableOpacity><View style={styles.headerCopy}><Text style={styles.headerTitle}>Create your event</Text><Text style={styles.headerSubtitle}>Uses the Circle’s winning time</Text></View><View style={styles.stepBadge}><Text style={styles.stepBadgeText}>2 of 4</Text></View></View><ScrollView contentContainerStyle={styles.modalContent}><Field label="Event name" value={name} onChange={setName} placeholder="Morning chess" /><Text style={styles.fieldLabel}>CATEGORY</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{CATEGORIES.slice(1).map((item) => <TouchableOpacity key={item} style={[styles.categoryChip, category === item && styles.categoryChipActive]} onPress={() => setCategory(item as Exclude<MeetupCategory, "All">)}><Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text></TouchableOpacity>)}</ScrollView><View style={styles.formReadOnly}><Clock3 size={18} color={Colors.textSecondary} /><View><Text style={styles.fieldLabel}>DATE & TIME</Text><Text style={styles.formValue}>{selectedTime}</Text></View></View><Text style={styles.fieldLabel}>LOCATION</Text><TouchableOpacity style={[styles.locationPickerButton, location && styles.locationPickerButtonSelected]} onPress={() => setLocationPickerVisible(true)}><View style={styles.locationPickerIcon}><MapPin size={20} color={Colors.primaryDark} /></View><View style={styles.optionCopy}><Text style={styles.optionTitle}>{location ? "Selected location" : "Choose a location"}</Text><Text numberOfLines={2} style={styles.optionMeta}>{location?.address ?? "Search for a place or drop a pin on the map"}</Text></View><ChevronRight size={19} color={Colors.textSecondary} /></TouchableOpacity><Field label="Description" value={description} onChange={setDescription} placeholder="What should members expect?" multiline /><Field label="Booking link (optional)" value={bookingUrl} onChange={setBookingUrl} placeholder="https://..." /><Text style={styles.fieldLabel}>VISIBILITY</Text><View style={styles.visibilityRow}><TouchableOpacity style={[styles.visibilityChoice, !isPublic && styles.visibilityChoiceActive]} onPress={() => setIsPublic(false)}><Users size={18} color={!isPublic ? Colors.primaryDark : Colors.textSecondary} /><Text style={styles.optionTitle}>Private</Text><Text style={styles.optionMeta}>Only your Circle</Text></TouchableOpacity><TouchableOpacity style={[styles.visibilityChoice, isPublic && styles.visibilityChoiceActive]} onPress={() => setIsPublic(true)}><Sparkles size={18} color={isPublic ? Colors.primaryDark : Colors.textSecondary} /><Text style={styles.optionTitle}>Public</Text><Text style={styles.optionMeta}>{publicEventLimitReached ? "Monthly limit used" : "Listed for 30 days"}</Text></TouchableOpacity></View>{isPublic && <View style={styles.ruleCard}><Text style={styles.optionTitle}>{publicEventLimitReached ? "Public event limit reached" : "Public event allowance"}</Text><Text style={styles.optionMeta}>Free members can publish 1 public event per month. Additional public events require Socio Plus. Public listings are removed after 30 days.</Text></View>}</ScrollView><View style={styles.footer}><Button title="Create event" onPress={submit} /></View><LocationPickerModal visible={locationPickerVisible} initialLocation={location} onClose={() => setLocationPickerVisible(false)} onConfirm={(pickedLocation) => { setLocation(pickedLocation); setLocationPickerVisible(false); }} /></SafeAreaView></Modal>;
}

function Field({ label, value, onChange, placeholder, multiline = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; multiline?: boolean }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label.toUpperCase()}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={Colors.textDisabled} multiline={multiline} style={[styles.fieldInput, multiline && styles.multiline]} /></View>;
}

const styles = createThemedStyles((Colors) => ({
  container: { flex: 1, backgroundColor: Colors.background }, flex: { flex: 1 }, loader: { flex: 1 }, emptyState: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.md, padding: Spacing.xl },
  header: { minHeight: 64, flexDirection: "row", alignItems: "center", paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.divider }, iconButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" }, headerCopy: { flex: 1, alignItems: "center" }, headerTitle: { ...Typography.h3, fontSize: 16 }, headerSubtitle: { ...Typography.bodySmall, fontSize: 11 }, stepBadge: { backgroundColor: Colors.primaryLight, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6 }, stepBadgeText: { ...Typography.label, color: Colors.primaryDark, fontSize: 10 },
  progressTrack: { flexDirection: "row", gap: 5, paddingHorizontal: Spacing.md, paddingTop: 10 }, progressSegment: { height: 3, borderRadius: 2, backgroundColor: Colors.divider, flex: 1 }, progressSegmentActive: { backgroundColor: Colors.primary }, scrollContent: { padding: Spacing.lg, paddingBottom: 36 }, eyebrow: { ...Typography.label, color: Colors.primaryDark, marginBottom: 7 }, title: { ...Typography.h2, marginBottom: 7 }, subtitle: { ...Typography.bodySmall, marginBottom: Spacing.lg }, cardList: { gap: 10 }, optionCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 13, gap: 12, backgroundColor: Colors.surface }, selectedCard: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }, tintIcon: { width: 42, height: 42, borderRadius: Radius.md, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" }, optionCopy: { flex: 1 }, optionTitle: { ...Typography.body, fontWeight: "700", fontSize: 14, lineHeight: 19 }, optionMeta: { ...Typography.bodySmall, fontSize: 12 }, voteCount: { ...Typography.label, color: Colors.textPrimary }, radio: { width: 23, height: 23, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, alignItems: "center", justifyContent: "center" }, radioSelected: { backgroundColor: Colors.primary, borderColor: Colors.primary }, addOption: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 17 }, addOptionText: { ...Typography.bodySmall, color: Colors.textPrimary, fontWeight: "600" }, waitingCard: { flexDirection: "row", alignItems: "center", gap: 11, padding: 14, borderRadius: Radius.md, backgroundColor: Colors.warningSurface }, avatarStack: { flexDirection: "row" }, miniAvatar: { borderWidth: 2, borderColor: Colors.warningSurface, borderRadius: Radius.full }, footer: { padding: Spacing.md, paddingBottom: Spacing.lg, gap: 4, borderTopWidth: 1, borderTopColor: Colors.divider, backgroundColor: Colors.background },
  sectionTitleRow: { flexDirection: "row", alignItems: "center" }, createLink: { flexDirection: "row", alignItems: "center", gap: 3, paddingVertical: 10 }, createLinkText: { ...Typography.label, color: Colors.primaryDark }, searchBar: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: Colors.inputBg, paddingHorizontal: 13, borderRadius: Radius.md, marginBottom: 13 }, searchInput: { flex: 1, height: 46, color: Colors.textPrimary, fontSize: 14 }, categories: { gap: 8, paddingBottom: 16 }, categoryChip: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 9 }, categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary }, categoryText: { ...Typography.label, color: Colors.textSecondary, fontSize: 11 }, categoryTextActive: { color: Colors.inverseText }, recommendationRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, listHeading: { ...Typography.h3, fontSize: 15, marginTop: Spacing.md, marginBottom: 10 }, timeFit: { ...Typography.label, color: Colors.success, fontSize: 10 }, eventCard: { flexDirection: "row", padding: 10, marginBottom: 10, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface }, eventArtwork: { width: 92, minHeight: 104, borderRadius: Radius.sm, backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center" }, sponsoredBadge: { position: "absolute", top: 6, left: 6, right: 6, borderRadius: Radius.pill, backgroundColor: Colors.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 4 }, sponsoredText: { ...Typography.label, color: Colors.primaryDark, fontSize: 8 }, eventBody: { flex: 1, paddingLeft: 12 }, eventTitleRow: { flexDirection: "row", alignItems: "center" }, eventTitle: { ...Typography.body, fontWeight: "700", flex: 1 }, eventMeta: { ...Typography.bodySmall, fontSize: 11, marginTop: 2 }, eventPrice: { ...Typography.label, color: Colors.textPrimary, marginTop: 5 }, eventFooter: { marginTop: "auto", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, fitBadge: { ...Typography.label, fontSize: 8, color: Colors.success, backgroundColor: Colors.successSurface, paddingHorizontal: 6, paddingVertical: 4, borderRadius: Radius.pill }, smallVote: { backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 6 }, smallVoteText: { ...Typography.label, color: Colors.inverseText, fontSize: 9 }, noResults: { alignItems: "center", gap: 7, paddingVertical: 40 }, monetizationNote: { flexDirection: "row", gap: 10, borderRadius: Radius.md, backgroundColor: Colors.warningSurface, padding: 14, marginTop: 12 },
  reviewHero: { alignItems: "center", borderRadius: Radius.lg, backgroundColor: Colors.primaryLight, padding: Spacing.lg, marginBottom: Spacing.md }, reviewHeroIcon: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.surface, alignItems: "center", justifyContent: "center", marginBottom: 12 }, reviewTitle: { ...Typography.h3, textAlign: "center" }, reviewSubtitle: { ...Typography.bodySmall, marginTop: 4 }, detailCard: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, overflow: "hidden" }, detailRow: { minHeight: 58, flexDirection: "row", alignItems: "center", paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider }, detailIcon: { width: 31 }, detailLabel: { ...Typography.label, width: 64 }, detailValue: { ...Typography.bodySmall, color: Colors.textPrimary, flex: 1, textAlign: "right", fontWeight: "600" }, confirmationRow: { flexDirection: "row", justifyContent: "center", gap: 17, marginVertical: 10 }, confirmationMember: { width: 54, alignItems: "center", gap: 5 }, confirmationName: { ...Typography.label, fontSize: 9, maxWidth: 54 }, readyDot: { position: "absolute", right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: Colors.success, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.surface }, bookingNotice: { flexDirection: "row", gap: 10, backgroundColor: Colors.warningSurface, borderRadius: Radius.md, padding: 14, marginTop: Spacing.md },
  scheduled: { flexGrow: 1, justifyContent: "center", padding: Spacing.lg, gap: 13 }, successIcon: { width: 104, height: 104, borderRadius: 52, backgroundColor: Colors.successSurface, alignItems: "center", justifyContent: "center", alignSelf: "center" }, successCheck: { position: "absolute", right: 11, bottom: 9, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.success, alignItems: "center", justifyContent: "center" }, scheduledTitle: { ...Typography.h1, fontSize: 29, textAlign: "center" }, scheduledSubtitle: { ...Typography.bodySmall, textAlign: "center", marginBottom: 10 }, scheduledCard: { borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md }, expiryText: { ...Typography.bodySmall, textAlign: "center", fontSize: 11 },
  modalPage: { flex: 1, backgroundColor: Colors.background }, modalHeader: { flexDirection: "row", alignItems: "center", minHeight: 60, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.divider }, modalContent: { padding: Spacing.lg, paddingBottom: 40 }, detailArtwork: { height: 190, borderRadius: Radius.lg, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primaryLight, marginBottom: Spacing.lg }, sponsoredLarge: { position: "absolute", top: 14, left: 14, flexDirection: "row", gap: 5, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: Colors.surface, borderRadius: Radius.pill }, linkRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: Spacing.lg }, linkText: { ...Typography.label, color: Colors.primaryDark }, field: { marginBottom: 15 }, fieldLabel: { ...Typography.label, fontSize: 10, marginBottom: 6 }, fieldInput: { minHeight: 48, borderRadius: Radius.md, backgroundColor: Colors.inputBg, paddingHorizontal: 13, color: Colors.textPrimary, fontSize: 14 }, multiline: { minHeight: 90, paddingTop: 13, textAlignVertical: "top" }, formReadOnly: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: Colors.inputBg, borderRadius: Radius.md, padding: 13, marginBottom: 15 }, formValue: { ...Typography.body, fontWeight: "600" }, visibilityRow: { flexDirection: "row", gap: 10, marginBottom: 12 }, visibilityChoice: { flex: 1, gap: 3, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 13 }, visibilityChoiceActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }, ruleCard: { backgroundColor: Colors.warningSurface, borderRadius: Radius.md, padding: 13 },
  customTimeHero: { alignItems: "center", gap: Spacing.sm, backgroundColor: Colors.primaryLight, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  locationPickerButton: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 11, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 12, marginBottom: 15, backgroundColor: Colors.surface },
  locationPickerButtonSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  locationPickerIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: Radius.full, backgroundColor: Colors.warningSurface },
  calendarCard: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg },
  calendarHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md },
  calendarArrow: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: Radius.full, backgroundColor: Colors.inputBg },
  calendarMonth: { ...Typography.h3, fontSize: 16 },
  weekRow: { flexDirection: "row", marginBottom: Spacing.sm },
  weekday: { ...Typography.label, color: Colors.textSecondary, textAlign: "center", width: "14.2857%" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.2857%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  dayCircle: { width: 35, height: 35, borderRadius: Radius.full, alignItems: "center", justifyContent: "center" },
  dayCircleSelected: { backgroundColor: Colors.primary },
  dayCircleToday: { borderWidth: 1, borderColor: Colors.primary },
  dayText: { ...Typography.bodySmall, color: Colors.textPrimary, fontWeight: "600" },
  dayTextDisabled: { color: Colors.textDisabled },
  dayTextSelected: { color: Colors.inverseText, fontWeight: "800" },
  timePickerLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  timePickerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm },
  timeSeparator: { ...Typography.h2, marginTop: 18 },
  wheelColumn: { flex: 1, alignItems: "center" },
  wheelLabel: { ...Typography.label, height: 18, color: Colors.textSecondary },
  wheelWindow: { height: 132, width: "100%", overflow: "hidden" },
  wheelSelection: { position: "absolute", top: 44, left: 0, right: 0, height: 44, borderRadius: Radius.sm, backgroundColor: Colors.primaryLight },
  wheelContent: { paddingVertical: 44 },
  wheelItem: { height: 44, alignItems: "center", justifyContent: "center" },
  wheelText: { ...Typography.body, color: Colors.textDisabled, fontWeight: "600" },
  wheelTextSelected: { color: Colors.textPrimary, fontWeight: "800", fontSize: 17 },
}));
