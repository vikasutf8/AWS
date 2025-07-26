import { NextRequest, NextResponse } from "next/server";



import {
  S3Client,
  PutObjectCommand,
 
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


  const s3Client = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials:{
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    }
  });
export  async function GET(req: NextRequest) {

  const key = req.nextUrl.searchParams.get("key") 

  if(!key){
    return NextResponse.json({status:400,message:"key is required"});
  }

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME as string,
    Key: key,
  });

 const url = await getSignedUrl(s3Client, command, {
    expiresIn: 60 * 60,
  });

  return NextResponse.json({status:200,message:"success",url:url});
 
}
