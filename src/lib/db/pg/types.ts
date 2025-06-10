export interface Document {
  id: string;
  createdAt: Date;
  title: string;
  content: string | null;
  kind: 'text' | 'simple-code-block' | 'python-file-pyodide' | 'js-project-sandpack' | 'js-project-webcontainer' | 'js-project-bolt' | 'html-fragment' | 'image' | 'sheet';
  userId: string;
}
