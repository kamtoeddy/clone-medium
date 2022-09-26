export default {
  name: "comment",
  title: "Comment",
  type: "document",
  fields: [
    {
      description: "Comments won't show on the site without approval",
      name: "isApproved",
      title: "isApproved",
      type: "boolean",
    },
    {
      name: "comment",
      type: "text",
    },
    {
      name: "email",
      type: "string",
    },
    {
      name: "name",
      type: "string",
    },
    {
      name: "post",
      type: "reference",
      to: [{ type: "post" }],
    },
  ],
};
