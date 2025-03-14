const chai = require('chai');
const expect = chai.expect;
const delay = require('delay');

const {
    changeFolder,
    createInternalDS,
    uploadFileToDataSource,
    getDatasource,
    deleteDataSource,
    getDatasourceByName,
    createSnapshot,
    getSnapshot,
    getDsSnapshots
} = require('../utils/datasourceUtils');

const {
    pipelineRandomName
} = require('../utils/pipelineUtils');

const UploadFilesToDs = async (DsName, filesPath = './additionalFiles/dataset', commitMessage = 'first commit to ') => {
    console.log(`start working on DS - ${DsName}`);
    const fs = require('fs');
    const files = fs.readdirSync(filesPath).map(name => `./additionalFiles/dataset/${name}`);
    const res = await uploadFileToDataSource(DsName, files, commitMessage + DsName);
    return res;
}

describe('Datasource  Tests', () => {

    beforeEach(function () {
        console.log('\n-----------------------------------------------\n');
    });
    
    describe('internal DS', () => {
        it("create internal DS", async () => {
            const DsName = pipelineRandomName(8).toLowerCase();
            const res = await createInternalDS(DsName);
            console.log(res);
            await delay(10000);
            const ds = await getDatasource();
            const created = ds.data.filter(a => (a.name == DsName));
            expect(created.length).to.be.equal(1);
            deleteDataSource(DsName);;
        }).timeout(1000 * 60 * 3);

        it("upload files ", async () => {
            const DsName = pipelineRandomName(8).toLowerCase();
            await createInternalDS(DsName);
            await UploadFilesToDs(DsName);
            const ds = await getDatasourceByName(DsName);
            expect(ds.data.files.length).to.be.equal(7);
            await deleteDataSource(DsName);
        }).timeout(1000 * 60 * 5);

        it("upload files change folder", async () => {
            const DsName = pipelineRandomName(8).toLowerCase();
            await createInternalDS(DsName);
            await UploadFilesToDs(DsName);
            //  const ds =await getDatasourceByName(DsName)       
            await changeFolder(DsName, "jnk", "file_6.txt");
            const newDs = await getDatasourceByName(DsName);
            const file = newDs.data.files.find(o => o.name == "file_6.txt");
            expect(file.path).to.be.contain("jnk");
            await deleteDataSource(DsName);
        }).timeout(1000 * 60 * 5);

        it("snapshots ", async () => {
            const snapName = "first files";
            const snapName2 = "last files";
            const DsName = pipelineRandomName(8).toLowerCase();
            await createInternalDS(DsName);
            await UploadFilesToDs(DsName);
            const snap = await createSnapshot(DsName, snapName, "first");
            const snap2 = await createSnapshot(DsName, snapName2, "last 4");
            expect(snap.data.filteredFilesList.length).to.be.equal(3);
            expect(snap.data.droppedFiles.length).to.be.equal(4);
            expect(snap2.data.filteredFilesList.length).to.be.equal(4);
            expect(snap2.data.droppedFiles.length).to.be.equal(3);

            const getSnap = await getSnapshot(DsName, snapName);
            expect(getSnap.data.filteredFilesList.length).to.be.equal(3);
            expect(getSnap.data.droppedFiles.length).to.be.equal(4);

            const all = await getDsSnapshots(DsName);
            expect(all.data.length).to.be.equal(2);

            await deleteDataSource(DsName);;
        }).timeout(1000 * 60 * 5);
    });

    describe.skip('using ds', () => {
        const dsAlgPath = "docker.io/hkubedevtest/datasource-batch:v5qhlg42v"
        const readDsFiles = "docker.io/hkubedevtest/read-ds-file:v4vx1gakx"
    });
});
