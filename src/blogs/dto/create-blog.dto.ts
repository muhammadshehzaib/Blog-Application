import { BlogsCategories } from "../../category/schemas/category.schema"

export class CreateBlogDto{
    readonly title:string
    readonly content:string
    readonly createdAt:Date
    readonly category:BlogsCategories
}