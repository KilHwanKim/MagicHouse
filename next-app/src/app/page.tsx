import { BookshelfApp } from "@/components/bookshelf-app";
import { getFeatureConfig } from "@/lib/feature-config";

export default function Home() {
  const config = getFeatureConfig();

  return <BookshelfApp config={config} />;
}
