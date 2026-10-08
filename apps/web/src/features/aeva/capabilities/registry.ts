export const aevaCapabilities = {
  public: {
    portfolioSearch: true,
    documentSearch: false,
    navigation: true,
    projectFiltering: true,
    sectionHighlighting: true,
    resumeOpen: true,
    contactOpen: true,
    privateRetrieval: false,
    connectorAccess: false,
    externalWrite: false,
    adminAccess: false,
  },
  private: {
    portfolioSearch: true,
    privateRetrieval: false,
    githubRead: false,
    veyraRead: false,
    emailRead: false,
    calendarRead: false,
    externalWrite: false,
  },
} as const;

export type AevaConsumer = "public_aeva" | "private_aeva" | "monitor";
