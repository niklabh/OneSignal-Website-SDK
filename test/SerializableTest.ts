import { Uuid, InvalidUuidError } from "../src/models/Uuid";
import { expect } from 'chai';


describe('Model Serialization', function() {
    describe('Uuid', function() {
        it('should fail to create an invalid UUID', function() {
            try {
                new Uuid('invalid')
            } catch (e) {
                console.error(e);
                console.error(e.toString());
                console.error(e.stack);
            }
            expect(() => new Uuid('invalid')).to.throw(InvalidUuidError);
        });

        it('should serialize', function() {
            const uuidStr: string = '6b9f1375-7c6b-48b9-8bfa-d18f176f26b1';
            const uuid = new Uuid(uuidStr);
            expect(uuid.serialize()).to.eq(uuidStr);
        });

    });
});