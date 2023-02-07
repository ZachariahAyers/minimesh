import { CONSTANTS } from "../../constants/mesh.constants";

export const AVAILABLE_VIEW_CHOICES = ["HTML", "EJS", "Preact", "Markdown"];
export const RANDOM_SALUTATIONS = [
  // TODO: More corny/quirky salutations
  "is operational!",
  "is ready to go!",
  "is up and running!",
  "is alive!",
];
export const RANDOM_COLORS = Object.values(CONSTANTS.branding);
export const getRandomSalutation = () =>
  RANDOM_SALUTATIONS[Math.floor(Math.random() * RANDOM_SALUTATIONS.length)];
export const getRandomColor = () =>
  RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
