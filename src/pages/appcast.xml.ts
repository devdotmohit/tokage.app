import { getCollection } from "astro:content";

const fallbackChannel = {
  title: "Tokage",
  link: "https://tokage.app/",
  description: "Tokage updates",
  language: "en",
};

const xmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (match) => xmlEscapes[match] || match);

const toXmlText = (value: string | number) => escapeXml(String(value));

const renderItem = (data: {
  title: string;
  version: string | number;
  shortVersionString: string;
  pubDate: string;
  enclosure: {
    url: string;
    length: number;
    type: string;
    edSignature: string;
  };
  releaseNotesLink: string;
}) => `    <item>
      <title>${toXmlText(data.title)}</title>
      <sparkle:version>${toXmlText(data.version)}</sparkle:version>
      <sparkle:shortVersionString>${toXmlText(data.shortVersionString)}</sparkle:shortVersionString>
      <pubDate>${toXmlText(data.pubDate)}</pubDate>
      <enclosure
        url="${toXmlText(data.enclosure.url)}"
        length="${toXmlText(data.enclosure.length)}"
        type="${toXmlText(data.enclosure.type)}"
        sparkle:edSignature="${toXmlText(data.enclosure.edSignature)}" />
      <sparkle:releaseNotesLink>${toXmlText(data.releaseNotesLink)}</sparkle:releaseNotesLink>
    </item>`;

export async function GET() {
  const [channelEntries, itemEntries] = await Promise.all([
    getCollection("appcastChannel"),
    getCollection("appcast"),
  ]);

  const channel = channelEntries[0]?.data ?? fallbackChannel;
  const items = [...itemEntries].sort((a, b) => {
    const aDate = new Date(a.data.pubDate).getTime();
    const bDate = new Date(b.data.pubDate).getTime();
    return bDate - aDate;
  });

  const itemsXml = items.map((entry) => renderItem(entry.data)).join("\n\n");

  const appcastXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"
  xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle"
  xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${toXmlText(channel.title)}</title>
    <link>${toXmlText(channel.link)}</link>
    <description>${toXmlText(channel.description)}</description>
    <language>${toXmlText(channel.language)}</language>

${itemsXml}
  </channel>
</rss>
`;

  return new Response(appcastXml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
