import { GetStaticPaths, GetStaticProps } from "next";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity";
import { Post } from "../../typings";

import PortableText from "react-portable-text";
import { useForm, SubmitHandler } from "react-hook-form";
import { useState } from "react";

type Props = {
  post: Post;
};

interface FormInput {
  _id: string;
  email: string;
  name: string;
  comment: string;
}

export default function PostDetails({ post }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>();

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    setIsLoading(true);

    try {
      await fetch("/api/createComment", {
        method: "POST",
        body: JSON.stringify(data),
      });

      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);

      return console.log(err);
    }

    setIsSubmitted(true);
  };

  return (
    <main>
      <Header />

      <img
        src={urlFor(post.mainImage).url()}
        className="h-40 md:h-60 w-full object-cover"
      />

      <article className="max-w-3xl mx-auto p-5">
        <h1 className="text-3xl mt-10">{post.title}</h1>
        <h2 className="text-xl font-light text-gray-500 my-1">
          {post.description}
        </h2>

        <div className="flex items-center space-x-2">
          <img
            src={urlFor(post.author.image).url()}
            className="h-10 w-10 rounded-full"
          />

          <p className="font-extralight">
            Blog post by{" "}
            <span className="text-green-600">{post.author.name}</span> -
            Published at {new Date(post._createdAt).toLocaleString()}
          </p>
        </div>

        <PortableText
          className="mt-10"
          dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
          projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
          content={post.body}
          serializers={{
            h1: (props: any) => (
              <h1 className="text-2xl font-bold my-5" {...props} />
            ),
            h2: (props: any) => (
              <h2 className="text-xl font-bold my-5" {...props} />
            ),
            li: ({ children }: any) => (
              <li className="ml-4 list-disc">{children}</li>
            ),
            link: ({ href, children }: any) => (
              <a href={href} className="text-blue-500 hover:underline">
                {children}
              </a>
            ),
          }}
        />
      </article>

      <hr className="max-w-lg my-5 mx-auto border border-yellow-500" />

      {isSubmitted ? (
        <div className="flex flex-col p-10 my-10 text-white max-w-2xl mx-auto bg-yellow-500">
          <h3 className="text-3xl font-bold">Thank you for your feedback</h3>
          <p>Once approved, your comment will appear down below</p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col p-5 max-w-2xl mx-auto mb-10"
        >
          <h3 className="text-sm text-yellow-500">Enjoyed this article?</h3>
          <h4 className="text-3xl font-bold">Leave a comment below!</h4>
          <hr className="py-3 mt-2" />

          <input
            type="hidden"
            {...register("_id")}
            name="_id"
            value={post._id}
          />

          <label className="block mb-5">
            <span className="text-gray-700">Name</span>
            <input
              {...register("name", { required: true })}
              className="shadow border py-2 px-3 form-input mt-1 block w-full ring-yellow-500"
              type="text"
              placeholder="John Doe"
            />
          </label>

          <label className="block mb-5">
            <span className="text-gray-700">Email</span>
            <input
              {...register("email", { required: true })}
              className="shadow border py-2 px-3 form-input mt-1 block w-full ring-yellow-500"
              type="email"
              placeholder="john-doe@provider.com"
            />
          </label>

          <label className="block mb-5">
            <span className="text-gray-700">Comment</span>
            <textarea
              {...register("comment", { required: true })}
              className="shadow border py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 focus:ring outline-none"
              rows={8}
              placeholder=". . ."
            />
          </label>

          {/* validation errors */}
          <div className="flex flex-col p-5">
            {errors.email && (
              <span className="text-red-500">The Email Field is required</span>
            )}
            {errors.comment && (
              <span className="text-red-500">
                The Comment Field is required
              </span>
            )}
            {errors.name && (
              <span className="text-red-500">The Name Field is required</span>
            )}
          </div>

          <input
            type="submit"
            disabled={isLoading}
            value={isLoading ? "...Sending" : "Send"}
            className="bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline text-white font-bold py-2 px-4 rounded cursor-pointer"
          />
        </form>
      )}

      {/* Comments */}
      <div className="flex flex-col p-10 my-10 max-w-2xl mx-auto shadow-yellow-500 shadow space-y-2">
        <h3 className="text-4xl">Comments</h3>
        <hr className="pb-2" />

        {post.comments.map((comment) => (
          <div key={comment._id}>
            <div>
              <span className="text-yellow-500">{comment.name}: </span>
              {comment.comment}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const query = `*[_type=='post']{
        _id,
        slug { current }
      }`;

  const posts = await sanityClient.fetch(query);

  const paths = posts.map((post: Post) => ({
    params: { slug: post.slug.current },
  }));

  return { paths, fallback: "blocking" };
};

const revalidate = 24 * 60 * 60;

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const query = `*[_type=='post' && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author -> {
          name,
          image
        },
        'comments': *[
            _type=="comment" &&
            post._ref == ^._id &&
            isApproved == true],
        body,
        description,
        mainImage,
        slug
      }`;

  const post = await sanityClient.fetch(query, { slug: params?.slug });

  return post ? { props: { post }, revalidate } : { notFound: true };
};
