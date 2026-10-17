import {describe,it,expect} from 'vitest';
import {submissionSchema} from './submission-schema';
describe('Submission consent and validation',()=>{
 const base={kind:'contact',full_name:'Donator Test',email:'test@example.com',message:'Mesaj de verificare',consent:true};
 it('requires explicit data processing consent',()=>{expect(submissionSchema.safeParse({...base,consent:false}).success).toBe(false);expect(submissionSchema.safeParse(base).success).toBe(true);});
 it('requires a contact message of at least 10 characters',()=>{expect(submissionSchema.safeParse({...base,message:'123456789'}).success).toBe(false);expect(submissionSchema.safeParse({...base,message:'1234567890'}).success).toBe(true);});
});
