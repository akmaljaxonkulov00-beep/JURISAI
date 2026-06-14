export const formatDocument = (text: string) => text;
export const parseDocument = (text: string) => ({ content: text });
export const calculateConfidence = () => 0.8;
export const getDocumentTitle = (type: string) => type;
export const getMockDocument = () => ({ content: '', title: '' });
