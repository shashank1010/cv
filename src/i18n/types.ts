export type Locale = "en" | "de" | "ru";

export type SkillGroup = {
  label: string;
  items: string[];
};

export type Phase = {
  title: string;
  skills: string;
  bullets: string[];
};

export type Job = {
  title: string;
  company: string;
  dates: string;
  meta: string;
  summary: string;
  bullets?: string[];
  phases?: Phase[];
  footerLabel?: string;
  footer?: string;
};

export type Project = {
  name: string;
  href?: string;
  tag?: string;
  stack: string;
  description: string;
};

export type CtaCard = {
  label: string;
  text: string;
  subject: string;
};

export type Messages = {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    sectionsAria: string;
    intro: string;
    skills: string;
    experience: string;
    hobbies: string;
    langAria: string;
    download: string;
  };
  intro: {
    name: string;
    role: string;
    tagline: string;
  };
  contact: {
    title: string;
    aria: string;
    locationLabel: string;
    locationValue: string;
    emailLabel: string;
    email: string;
    phoneLabel: string;
    phones: Array<{ href: string; display: string }>;
    linkedinLabel: string;
    linkedinHandle: string;
    linkedinHref: string;
    githubLabel: string;
    githubHandle: string;
    githubHref: string;
    preferredLabel: string;
    preferredValue: string;
  };
  profile: {
    title: string;
    paragraphs: string[];
  };
  skills: {
    title: string;
    groups: SkillGroup[];
  };
  spoken: {
    title: string;
    items: string[];
  };
  experience: {
    title: string;
    jobs: Job[];
  };
  projects: {
    title: string;
    items: Project[];
  };
  education: {
    title: string;
    degree: string;
    school: string;
    year: string;
  };
  cta: {
    title: string;
    lead: string;
    aria: string;
    poke: string;
    pokeAria: string;
    cards: CtaCard[];
  };
  credits: {
    aria: string;
    copyright: string;
    builtWith: string;
    grok: string;
    lastUpdated: string;
  };
};
