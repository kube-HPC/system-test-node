const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const path = require('path');
const config = require(path.join(process.cwd(), 'config/config'));
const { StatusCodes } = require('http-status-codes');


const { 
    getAllAlgorithms
} = require('../utils/socketGet');

chai.use(chaiHttp);

describe('graphql tests', () => {
    let guest_token;
    let nopermissions_token;

    before(async function () {
        this.timeout(1000 * 60 * 15);
        // guest user login
    
        const userCredentials = [
            { name: 'guest', username: config.keycloakGuestUser, password: config.keycloakGuestPass },
            { name: 'nopermissions', username: 'nopermissions', password: '123' }
        ];

        const tokens = await Promise.all(userCredentials.map(async (userBody, index) => {
            names = ['guest', 'nopermissions'];
            const response = await chai.request(config.apiServerUrl)
                .post('/auth/login')
                .send(userBody);
    
            if (response.status === 200) {
                console.log(`${names[index]} login success`);
                return response.body.token;
            }
            console.log(`${names[index]} login failed - no keycloak/bad credentials`);
            return undefined;
        }));

        guest_token = tokens[0];
        nopermissions_token = tokens[1];
    });

    beforeEach(function () {
        console.log('\n-----------------------------------------------\n');
    });

    after(function () {
        console.log("----------------------- end -----------------------");
    });

    describe('autherntication tests', async function () {
        before(function () {
            if (!guest_token) {
                console.log('guest login failed - no keycloak/bad credentials. If keycloak is enabled, fix credentials. If it is disabled, test suite skipped.');
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
            const testUserBody ={
                username: 'nopermissions',
                password: '123'
            }
    
            const response = await chai.request(config.apiServerUrl)
                .post('/auth/login')
                .send(testUserBody)
            
            let token;
            if (response.status === StatusCodes.OK) {
                console.log(`${testUserBody.user} user login success`);
                token = response.body.token;
            }
        
            let errorCaught = false;
            try {
                await getAllAlgorithms(token);
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