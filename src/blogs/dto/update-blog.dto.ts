import { BlogsCategories } from "../../category/schemas/category.schema"
import { Status } from "../schemas/blogs.schema"

export class UpdateBlogDto{
    readonly title:string
    readonly content:string
    readonly createdAt:Date
    readonly category:BlogsCategories
    readonly status:Status


}