
export interface Document {
  id: string;
  title: string;
  rawText: string;
  documentedText: string;
  screenshots: string[]; // array of base64 data URLs
  category: string;
  tags: string[];
  createdAt: number;
}
