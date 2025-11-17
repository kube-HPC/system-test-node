const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const { StatusCodes } = require('http-status-codes');


const {
    getAllAlgorithms
} = require('../utils/socketGet');

const { loginWithRetry } = require('../utils/misc_utils');

chai.use(chaiHttp);

describe('graphql tests', () => {
    let guest_token;
    let nopermissions_token;
    let keycloakIsDisabled = false;

    before(async function () {
        this.timeout(1000 * 60 * 15);
        guest_token = await loginWithRetry(config.keycloakGuestUser, config.keycloakGuestPass);
        nopermissions_token = await loginWithRetry('nopermissions', '1234');
    });

    beforeEach(function () {
        console.log('\n-----------------------------------------------\n');
    });

    after(function () {
        console.log("----------------------- end -----------------------");
    });

    describe('autherntication tests', async function () {
        before(function () {
            if (keycloakIsDisabled) {
                console.log('Keycloak is disabled. Skipping tests that require keycloak.');
                this.skip(); // Skips authentication tests since keycloak is not enabled (if credentials are incorrect, fix them).
            }
        });

        it('should fail to get all algorithms via GraphQL', async () => {
            let errorCaught = false;
            try {
                await getAllAlgorithms("invalid token");
            }
            catch (error) {
                errorCaught = true;
                expect(error.response.status).to.be.equal(StatusCodes.UNAUTHORIZED);
                expect(error.response.errors[0].code).to.be.equal('UNAUTHORIZED');
                expect(error.response.errors[0].message).to.be.equal('Unauthorized: Missing or invalid token');
                expect(error.response.errors[0].status).to.be.equal(StatusCodes.UNAUTHORIZED);
            }
            expect(errorCaught).to.be.equal(true, 'Expected error to be thrown for invalid token');
        });

        it('should fail getting all algorithms with no permission', async () => {
            let errorCaught = false;
            try {
                await getAllAlgorithms(nopermissions_token);
            }
            catch (error) {
                errorCaught = true;
                expect(error.response.status).to.be.equal(StatusCodes.FORBIDDEN);
                expect(error.response.errors[0].code).to.be.equal('FORBIDDEN');
                expect(error.response.errors[0].message).to.be.equal('Forbidden: You do not have access to this resource');
                expect(error.response.errors[0].status).to.be.equal(StatusCodes.FORBIDDEN);
            }
            expect(errorCaught).to.be.equal(true, 'Expected error to be thrown for no permissions');
        }).timeout(1000 * 60)
    });
});