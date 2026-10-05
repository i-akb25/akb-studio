export type AboutMedia = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

export type AboutWaypoint = {
  index: string;
  title: string;
  description: string;
};

export type AboutDiscipline = {
  id: string;
  label: string;
  note: string;
  href?: string;
};

export type AboutTravelEntry = {
  id: string;
  place: string;
  note: string;
  media: AboutMedia;
};

export type AboutCreativeEntry = {
  id: string;
  discipline: "Photography" | "Painting" | "Design & visual work";
  note: string;
  media: AboutMedia;
};

export type AboutInterestEntry = {
  id: string;
  title: string;
  note: string;
  media: AboutMedia;
  images?: AboutMedia[];
};

export type AboutPrinciple = {
  index: string;
  title: string;
  description: string;
};

export type AboutProfile = {
  name: string;
  profileImage: AboutMedia;
  headline: string;
  introduction: string;
  thesis: string;
  waypoints: AboutWaypoint[];
  disciplines: AboutDiscipline[];
  travel: AboutTravelEntry[];
  creative: AboutCreativeEntry[];
  interests: AboutInterestEntry[];
  principles: AboutPrinciple[];
  current: {
    title: string;
    body: string;
  };
};
