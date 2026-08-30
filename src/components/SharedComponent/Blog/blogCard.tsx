import React, { FC } from "react";
import Image from "next/image";
import { Blog } from "@/types/blog";
import { format } from "date-fns";
import Link from "next/link";
import { getImagePrefix } from "@/utils/util";

const BlogCard = ({ blog }: { blog: Blog }) => {
    const { title, coverImage, excerpt, date, slug } = blog;
    return (
        <>
            <Link href={`/blog/${slug}`} className="group mb-10 flex flex-col gap-6 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md md:flex-row md:items-center">
                <div className="overflow-hidden rounded-[1.25rem] md:w-72">
                    <Image 
                        src= {`${getImagePrefix()}${coverImage}`}
                        alt="image"
                        width={300}
                        height={250}
                        className="group-hover:scale-110 duration-300 w-full h-auto"
                    />
                </div>
                <div className="md:flex-1">
                    <span className="text-16 text-slate-600 mb-1 block">
                        {format(new Date(date), "MMM dd yyyy")}
                    </span>
                    <h5 className="text-22 font-medium mb-4 text-slate-900 group-hover:text-primary">
                        {title}
                    </h5>
                    <p className="text-primary text-17 font-medium ">
                        Read More
                    </p>
                </div>
            </Link>
        </>
    );
};

export default BlogCard;