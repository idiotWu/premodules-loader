import { expect } from 'chai';

import { compStyle, compClasses } from './comp.js';
import { locals as extendClasses } from './extend.scss';
import mirrorStyle from './mirror.scss';

describe('class-share loader test', () => {
  describe('style imports', () => {
    it('result should be an object', () => {
      expect(compClasses).to.be.an('object');
      expect(extendClasses).to.be.an('object');
    });

    it('result should not be empty', () => {
      expect(Object.keys(compClasses)).to.have.length.above(0);
      expect(Object.keys(extendClasses)).to.have.length.above(0);
    });
  });

  describe('inherited module', () => {
    it('should contain parent\'s classes', () => {
      expect(extendClasses).to.contain.all.keys(compClasses);
    });

    it('should share same classes in css text', () => {
      expect(mirrorStyle[0][1]).to.be.equal(compStyle[0][1]);
    });
  });
});
