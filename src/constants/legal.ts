export type LegalDocumentKey = "privacy" | "terms" | "data-compliance";

export type LegalSection = {
  title: string;
  body: string[];
  bullets?: string[];
};

export type LegalDocument = {
  key: LegalDocumentKey;
  title: string;
  eyebrow: string;
  updatedAt: string;
  summary: string;
  sections: LegalSection[];
};

export const LEGAL_CONTACT_EMAIL = "privacy@sociol.app";
export const LEGAL_COMPANY_NAME = "Sociol";
export const LEGAL_EFFECTIVE_DATE = "2026-07-06T12:00:00Z";

const privacySections: LegalSection[] = [
  {
    title: "legal.content.whoWeAre",
    body: [
      "legal.content.thisPrivacyPolicyExplainsHowSociolCollectsUses",
      "legal.content.sociolHelpsPeopleFormSmallInPersonFriend",
    ],
  },
  {
    title: "legal.content.informationWeCollect",
    body: [
      "legal.content.weCollectInformationYouProvideDirectlyInformationCreated",
    ],
    bullets: [
      "legal.content.accountInformationSuchAsYourNameEmailAddress",
      "legal.content.profileInformationSuchAsAgeGenderEducationInterests",
      "legal.content.locationInformationSuchAsPermissionStateApproximateLocation",
      "legal.content.circleAndMatchingInformationSuchAsCirclesYou",
      "legal.content.communicationsAndContentSuchAsChatMessagesMedia",
      "legal.content.safetyInformationSuchAsBlockedUsersReportHistory",
      "legal.content.deviceAppAndDiagnosticInformationSuchAsPlatform",
      "legal.content.purchaseInformationSuchAsStorePlatformProductId",
    ],
  },
  {
    title: "legal.content.howWeUseInformation",
    body: [
      "legal.content.weUsePersonalInformationToProvidePersonalizeSecure",
    ],
    bullets: [
      "legal.content.createAndAuthenticateAccounts",
      "legal.content.buildProfilesAndMatchPeopleIntoCircles",
      "legal.content.showSwipeDecksLikesCircleProgressChatNotifications",
      "legal.content.supportInPersonMeetupsWithApproximateLocationAnd",
      "legal.content.processSociolSubscriptionsThroughAppleAppStoreAnd",
      "legal.content.detectAbuseReviewReportsEnforceOurTermsAnd",
      "legal.content.providePrivacySafetyDataExportAndAccountDeletion",
      "legal.content.debugCrashesPreventFraudMaintainSecurityAndComply",
    ],
  },
  {
    title: "legal.content.legalBasesForProcessing",
    body: [
      "legal.content.whereGdprOrSimilarLawAppliesWeRely",
    ],
    bullets: [
      "legal.content.contractToCreateYourAccountProvideMatchingCircles",
      "legal.content.consentForOptionalPermissionsOrFeaturesSuchAs",
      "legal.content.legitimateInterestsToKeepSociolSafePreventAbuse",
      "legal.content.legalObligationToComplyWithApplicableLawRespond",
      "legal.content.vitalInterestsOrPublicInterestOnlyWhereNecessary",
    ],
  },
  {
    title: "legal.content.howWeShareInformation",
    body: [
      "legal.content.weDoNotSellPersonalInformationWeShare",
    ],
    bullets: [
      "legal.content.withOtherUsersSuchAsProfileDetailsShown",
      "legal.content.withServiceProvidersSuchAsSupabaseForAuthentication",
      "legal.content.withModeratorsAndAdminsWhenTheyReviewReports",
      "legal.content.withLegalOrSafetyAuthoritiesWhenRequiredBy",
      "legal.content.inABusinessTransferSuchAsAMerger",
    ],
  },
  {
    title: "legal.content.sensitiveInformation",
    body: [
      "legal.content.someSociolDataMayBeConsideredSensitiveUnder",
      "legal.content.weUseSensitiveInformationOnlyToProvideRequested",
    ],
  },
  {
    title: "legal.content.retentionAndDeletion",
    body: [
      "legal.content.weKeepInformationForAsLongAsNeeded",
      "legal.content.youCanRequestAccountDeletionInTheApp",
      "legal.content.someContentMayRemainVisibleWhereTechnicallyOr",
    ],
  },
  {
    title: "legal.content.yourChoicesAndRights",
    body: [
      "legal.content.dependingOnWhereYouLiveYouMayHave",
    ],
    bullets: [
      "legal.content.accessAndExportUseDownloadMyDataIn",
      "legal.content.correctionUpdateYourProfileInTheAppOr",
      "legal.content.deletionUseDeleteAccountInSettingsOrContact",
      "legal.content.consentWithdrawalChangeDevicePermissionsNotificationSettingsPrivacy",
      "legal.content.optOutOfSaleShareWeDoNot",
      "legal.content.nonDiscriminationWeWillNotDiscriminateAgainstYou",
    ],
  },
  {
    title: "legal.content.californiaPrivacyRights",
    body: [
      "legal.content.ifYouAreACaliforniaResidentTheCcpa",
      "legal.content.weDoNotSellPersonalInformationWeDo",
    ],
  },
  {
    title: "legal.content.gdprAndInternationalRights",
    body: [
      "legal.content.ifYouAreInTheEeaUkOr",
      "legal.content.sociolMayProcessAndStoreInformationInCountries",
    ],
  },
  {
    title: "legal.content.childrenAndAgeLimits",
    body: [
      "legal.content.sociolIsNotIntendedForChildrenYouMust",
    ],
  },
  {
    title: "legal.content.security",
    body: [
      "legal.content.weUseTechnicalAndOrganizationalSafeguardsDesignedTo",
      "legal.content.noSystemIsPerfectlySecureIfYouBelieve",
    ],
  },
  {
    title: "legal.content.changesAndContact",
    body: [
      "legal.content.weMayUpdateThisPrivacyPolicyAsSociol",
    ],
  },
];

const termsSections: LegalSection[] = [
  {
    title: "legal.content.agreementToTheseTerms",
    body: [
      "legal.content.theseTermsOfUseGovernYourAccessTo",
      "legal.content.ifYouDoNotAgreeDoNotUse",
    ],
  },
  {
    title: "legal.content.eligibility",
    body: [
      "legal.content.youMustBeAtLeast18YearsOld",
      "legal.content.youMustProvideAccurateAccountAndProfileInformation",
    ],
  },
  {
    title: "legal.content.whatSociolProvides",
    body: [
      "legal.content.sociolHelpsUsersCreateAndJoinSmallFriend",
      "legal.content.sociolDoesNotGuaranteeMatchesFriendshipsMeetupAttendance",
    ],
  },
  {
    title: "legal.content.offlineMeetupsAndSafety",
    body: [
      "legal.content.sociolCanHelpPeopleDiscoverCirclesButUsers",
      "legal.content.useGoodJudgmentMeetInPublicPlacesTell",
    ],
  },
  {
    title: "legal.content.userConduct",
    body: [
      "legal.content.youAgreeNotToMisuseSociolOrHarm",
    ],
    bullets: [
      "legal.content.noHarassmentBullyingThreatsHateExploitationSexualCoercion",
      "legal.content.noImpersonationFakeProfilesDeceptiveConductSpamScams",
      "legal.content.noIllegalActivityOrEncouragementOfIllegalOr",
      "legal.content.noPostingOrSharingContentYouDoNot",
      "legal.content.noSexualContentInvolvingMinorsNonConsensualIntimate",
      "legal.content.noScrapingReverseEngineeringAutomatedAccountCreationSecurity",
      "legal.content.noUsingSociolToSellGoodsOrServices",
    ],
  },
  {
    title: "legal.content.contentAndLicense",
    body: [
      "legal.content.youOwnTheContentYouSubmitToSociol",
      "legal.content.youAreResponsibleForYourContentDoNot",
    ],
  },
  {
    title: "legal.content.moderationAndEnforcement",
    body: [
      "legal.content.weMayReviewReportsContentAccountsCircleActivity",
      "legal.content.moderationDecisionsMayRelyOnUserReportsAutomated",
    ],
  },
  {
    title: "legal.content.sociolAndPayments",
    body: [
      "legal.content.sociolIsADigitalSubscriptionThatWhenAvailable",
      "legal.content.subscriptionsRenewUnlessCanceledAccordingToAppleOr",
    ],
  },
  {
    title: "legal.content.accountDeletionAndTermination",
    body: [
      "legal.content.youCanDeleteYourAccountInSettingsWe",
      "legal.content.afterTerminationProvisionsThatByNatureShouldSurvive",
    ],
  },
  {
    title: "legal.content.disclaimers",
    body: [
      "legal.content.sociolIsProvidedAsIsAndAsAvailable",
      "legal.content.toTheMaximumExtentPermittedByLawWe",
    ],
  },
  {
    title: "legal.content.limitationOfLiability",
    body: [
      "legal.content.toTheMaximumExtentPermittedByLawSociol",
      "legal.content.someJurisdictionsDoNotAllowCertainLimitationsSo",
    ],
  },
  {
    title: "legal.content.changesAndContact",
    body: [
      "legal.content.weMayUpdateTheseTermsAsSociolEvolves",
    ],
  },
];

const complianceSections: LegalSection[] = [
  {
    title: "legal.content.complianceOverview",
    body: [
      "legal.content.thisDataComplianceNoticeSummarizesSociolSPrivacy",
      "legal.content.itIsDesignedToSupportAppStoreReview",
    ],
  },
  {
    title: "legal.content.dataCategoriesAndPurpose",
    body: [
      "legal.content.sociolCollectsDataOnlyWhereItSupportsAccount",
    ],
    bullets: [
      "legal.content.identifiersAccountIdEmailDisplayNameAuthProvider",
      "legal.content.profileDataAgeGenderEducationInterestsTraitsBio",
      "legal.content.locationDataPermissionStateApproximateLocationCityMatching",
      "legal.content.userActivitySwipesLikesCircleCreationCircleMembership",
      "legal.content.communicationsChatMessagesSharedMediaPollsRepliesReports",
      "legal.content.commercialDataSociolProductIdPlatformTransactionOr",
      "legal.content.securityDataLogsAuditTrailsModerationActionsBlocked",
    ],
  },
  {
    title: "legal.content.ccpaCpraCoverage",
    body: [
      "legal.content.californiaResidentsMayHaveRightsToKnowAccess",
      "legal.content.sociolDoesNotSellPersonalInformationSociolDoes",
    ],
  },
  {
    title: "legal.content.gdprCoverage",
    body: [
      "legal.content.whereGdprOrUkGdprAppliesSociolProvides",
      "legal.content.processingBasesIncludeContractConsentLegitimateInterestsLegal",
    ],
  },
  {
    title: "legal.content.dataSubjectRequests",
    body: [
      "legal.content.usersCanExerciseManyRightsDirectlyInThe",
    ],
    bullets: [
      "legal.content.accessExportPrivacySafetyDownloadMyData",
      "legal.content.correctionEditProfileOrContactPrivacySupport",
      "legal.content.deletionSettingsDeleteAccount",
      "legal.content.visibilityControlsPrivacySafetyToggles",
      "legal.content.locationNotificationMediaPermissionsDeviceSettingsAndIn",
      "legal.content.manualPrivacyRequestsPrivacySociolApp",
    ],
  },
  {
    title: "legal.content.retentionPolicy",
    body: [
      "legal.content.accountAndProfileDataAreRetainedWhileAn",
      "legal.content.chatAndCircleRecordsMayHaveRetentionLimits",
    ],
  },
  {
    title: "legal.content.processorsAndSubprocessors",
    body: [
      "legal.content.sociolUsesServiceProvidersToOperateTheApp",
      "legal.content.beforeProductionLaunchSociolShouldMaintainAProcessor",
    ],
  },
  {
    title: "legal.content.securityControls",
    body: [
      "legal.content.sociolUsesSupabaseAuthenticationRowLevelAccessControls",
      "legal.content.beforeLaunchSociolShouldCompleteSecurityReviewFor",
    ],
  },
  {
    title: "legal.content.appStoreComplianceChecklist",
    body: [
      "legal.content.beforeSubmissionSociolShouldKeepTheseItemsTrue",
    ],
    bullets: [
      "legal.content.privacyPolicyUrlIsPublicActiveNonPdf",
      "legal.content.privacyPolicyLinkOrTextIsAvailableInside",
      "legal.content.applePrivacyNutritionLabelsAndGooglePlayData",
      "legal.content.accountDeletionIsAvailableInAppAndThrough",
      "legal.content.sociolUsesAppleInAppPurchaseAndGoogle",
      "legal.content.permissionPromptsHaveClearInAppContextFor",
      "legal.content.legalDocumentsIncludeEffectiveDatesAndContactInformation",
    ],
  },
  {
    title: "legal.content.importantNote",
    body: [
      "legal.content.thisNoticeIsAnOperationalComplianceSummaryIt",
    ],
  },
];

export const LEGAL_DOCUMENTS: Record<LegalDocumentKey, LegalDocument> = {
  privacy: {
    key: "privacy",
    title: "legal.content.privacyPolicy",
    eyebrow: "legal.content.legal",
    updatedAt: LEGAL_EFFECTIVE_DATE,
    summary:
      "legal.content.howSociolCollectsUsesSharesRetainsAndProtects",
    sections: privacySections,
  },
  terms: {
    key: "terms",
    title: "legal.content.termsOfUse",
    eyebrow: "legal.content.legal",
    updatedAt: LEGAL_EFFECTIVE_DATE,
    summary:
      "legal.content.theRulesForUsingSociolCreatingCirclesChatting",
    sections: termsSections,
  },
  "data-compliance": {
    key: "data-compliance",
    title: "legal.content.dataCompliance2",
    eyebrow: "legal.content.privacy",
    updatedAt: LEGAL_EFFECTIVE_DATE,
    summary:
      "legal.content.aPlainLanguageSummaryOfSociolSData",
    sections: complianceSections,
  },
};
