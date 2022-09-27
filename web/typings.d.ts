export type Comment = {
  _id: string;
  comment: string;
  email: string;
  name: string;
};

export type Post = {
  _id: string;
  _createdAt: string;
  author: { name: string; image: string };
  body: object[];
  comments: Comment[];
  description: string;
  mainImage: { asset: { url: string } };
  title: string;
  slug: { current: string };
};
