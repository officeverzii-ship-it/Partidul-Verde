import {z} from 'zod';
import {isValidCnp} from './cnp';
export const membershipSchema=z.object({
 full_name:z.string().trim().min(2).max(100),email:z.string().trim().email().max(255),phone:z.string().trim().regex(/^[0-9+().\s-]{9,20}$/),
 cnp:z.string().refine(isValidCnp,'CNP-ul trebuie să conțină 13 cifre și să fie valid.'),
 birth_date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>new Date(v)<=new Date(),'Data nașterii nu poate fi în viitor.'),
 profession:z.string().trim().max(100),workplace:z.string().trim().max(150),county:z.string().trim().min(2).max(50),city:z.string().trim().min(2).max(80),address:z.string().trim().min(3).max(500),
 activity_type:z.enum(['activ','simpatizant']),education:z.enum(['Elementare','Medii','Postliceale','Superioare','Postuniversitare','Doctorat']),
 mother_tongue:z.string().trim().min(2).max(80),other_languages:z.string().trim().max(300),motivation:z.string().trim().min(10).max(2000),
 gdpr_consent:z.literal(true),general_consent:z.literal(true),
}).superRefine((v,c)=>{
 const s=Number(v.cnp[0]);const century=s===3||s===4?1800:s===5||s===6?2000:1900;
 const birth=`${century+Number(v.cnp.slice(1,3))}-${v.cnp.slice(3,5)}-${v.cnp.slice(5,7)}`;
 if(v.birth_date!==birth)c.addIssue({code:'custom',path:['birth_date'],message:'Data nașterii nu corespunde CNP-ului.'});
});
