import {describe,it,expect} from 'vitest';
import {membershipSchema} from './membership-schema';
const valid={full_name:'Test Adeziune',email:'test@example.com',phone:'0746000000',cnp:'1900101400012',birth_date:'1990-01-01',profession:'',workplace:'',county:'București',city:'București',address:'Adresa de test 1',activity_type:'activ',education:'Superioare',mother_tongue:'română',other_languages:'',motivation:'Mesaj pentru verificarea înscrierii',gdpr_consent:true,general_consent:true};
describe('Membership personal data',()=>{
 it('accepts exactly 13 digits with a valid CNP checksum',()=>{expect(membershipSchema.safeParse(valid).success).toBe(true);expect(membershipSchema.safeParse({...valid,cnp:'19001014000120'}).success).toBe(false);expect(membershipSchema.safeParse({...valid,cnp:'1900101400016'}).success).toBe(false);});
 it('requires both GDPR and general agreement',()=>{expect(membershipSchema.safeParse({...valid,gdpr_consent:false}).success).toBe(false);expect(membershipSchema.safeParse({...valid,general_consent:false}).success).toBe(false);});
 it('rejects birth dates inconsistent with the CNP',()=>{expect(membershipSchema.safeParse({...valid,birth_date:'1990-01-02'}).success).toBe(false);});
});
