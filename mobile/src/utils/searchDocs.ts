import { DocumentMeta } from '../api/documents.api';

export interface SearchableDoc extends DocumentMeta {
  memberName: string;
  categoryLabel: string;
}

export function buildSearchableDocs(
  docs: DocumentMeta[],
  membersMap: Map<string, string>,
  categoryLabels: Record<string, string>
): SearchableDoc[] {
  return docs.map(doc => ({
    ...doc,
    memberName: membersMap.get(doc.belongsTo) ?? 'Unknown',
    categoryLabel: categoryLabels[doc.category] ?? doc.category,
  }));
}

export function filterDocs(docs: SearchableDoc[], query: string): SearchableDoc[] {
  const q = query.toLowerCase().trim();
  if (!q) return docs;
  return docs.filter(
    doc =>
      doc.name.toLowerCase().includes(q) ||
      doc.memberName.toLowerCase().includes(q) ||
      doc.categoryLabel.toLowerCase().includes(q)
  );
}
