import type { NextApiRequest, NextApiResponse } from "next";

import { config } from "../../sanity/config";
import { sanityClient } from "../../sanity";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { _id, comment, email, name } = JSON.parse(req.body);

  try {
    await sanityClient.create({
      _type: "comment",
      post: { _type: "reference", _ref: _id },
      comment,
      email,
      name,
    });
  } catch (error) {
    res.status(500).json({ message: "Could not submit comment", error });
  }

  res.status(200).json({ message: "Comment submitted" });
}
