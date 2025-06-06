import {SendMailClient} from "zeptomail";

export default async (email, name, subject, html)=>{
    const url = "api.zeptomail.com/";
    const token = process.env.ZEPTO_TOKEN;

    let client = new SendMailClient({url, token});

    try{
        await client.sendMail({
            from: {
                address: "InletShop@inletsites.dev",
                name: "Inlet Shop"
            },
            to: [{
                email_address: {
                    address: email,
                    name: name
                }
            }],
            subject: subject,
            htmlbody: html
        });
    }catch(e){
        console.error(e);
    }
}
