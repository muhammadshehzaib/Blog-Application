import { ApiProperty } from "@nestjs/swagger"

export class CreateUserDto{
    @ApiProperty({
        description:"Username",
        example:"Shehzaib",
    })
    readonly username:string
    
    @ApiProperty({
        description:"email",
        example:"shehzaib001@gmail.com",
    })
    readonly email:string

    @ApiProperty({
        description:"password",
        example:"shehzaib001",
    })
    readonly password:string

}

