import { IsOptional, IsString, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RejectAdDto {
    @ApiProperty({ required: false, example: "Reason for rejection" })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    comment?: string;
}
