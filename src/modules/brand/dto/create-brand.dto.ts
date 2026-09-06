import {IBrand} from "src/common/interfaces/index"
import {MaxLength,MinLength,IsNotEmpty,IsString} from "class-validator"
export class CreateBrandDto implements Partial<IBrand>
{
@MaxLength(50)
@MinLength(2)
@IsString()
@IsNotEmpty()
name!:string;
}
