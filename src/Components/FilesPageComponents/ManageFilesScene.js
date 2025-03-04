import React, { useEffect, useState } from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchFilesDdb } from "../DynamoDBFunctions";
import UploadLogo from "../../Images/UploadLogo.png";
import DeleteIcon from "@mui/icons-material/Delete";
import FileTypeSelectionDialog from "./FileTypeSelectionDialog";
import csvFileToArray from "./PipelineSummaryFiles/CsvFileToArrayInFilesPage";
import { API, graphqlOperation } from "aws-amplify";
import { deleteFile } from "../../graphql/mutations";
import alertify from "alertifyjs";
import InitialPipelineFileColumnSelection from "./InitialPipelineFiles/InitialPipelineFileColumnSelection";
import FileAnonymizer from "./InitialPipelineFiles/FileAnonymizer";
import FilesTable from "./FilesTable";
import MarketingInputFileDataProcessor from "./MarketingInputFiles/MarketingInputFileDataProcessor";
import { Backdrop, CircularProgress, Button } from "@mui/material";

const FilesList = () => {
  const [filesFromDdb, setFilesFromDdb] = useState([]);
  const [selected, setSelected] = useState([]);
  const [username, setUsername] = useState("");
  const [update, setUpdate] = useState(false);
  const [displayDeleteButton, setDisplayDeleteButton] = useState(false);
  const [open, setOpen] = useState(false);
  const [
    displayInitialPipelineFileColumnSelection,
    setDisplayInitialPipelineFileColumnSelection,
  ] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");
  const [InitialPipelineFile, setInitialPipelineFile] = useState("");
  const [anonymizeColumns, setAnonymizeColumns] = useState([]);
  const [uploadFileName, setUploadFileName] = useState("");
  const [loading, setLoading] = useState(false);

  // It will store the file uploaded by the user
  const fileReader = new FileReader();
  const fileReaderInitialPipelineFile = new FileReader();
  const fileReaderMarketingInputFile = new FileReader();

  // input ref
  const inputRefPipelineSummaryFile = React.useRef(null);
  const inputRefInitialPipelineFile = React.useRef(null);
  const inputRefMarketingInputFile = React.useRef(null);

  // Get the user from the cognito authenticator
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);

  const handleSetUpdate = () => {
    setUpdate(!update);
  };

  useEffect(() => {
    if (authStatus === "authenticated") {
      setUsername(user.username);
      const fetchData = async () => {
        try {
          const fileResult = await fetchFilesDdb();
          setFilesFromDdb(fileResult);
        } catch (e) {
          console.log(e);
        }
      };

      fetchData();
    }
  }, [user, authStatus, update]);

  const handlePipelineSummaryFileChange = async function (e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      fileReader.onload = function (event) {
        const text = event.target.result;
        csvFileToArray({
          string: text,
          username: username,
          handleSetUpdate: handleSetUpdate,
          fileName: file.name,
        });
      };

      fileReader.readAsText(file);
    }
  };

  const handleInitialPipelineFileChange = async function (e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      fileReaderInitialPipelineFile.onload = function (event) {
        const text = event.target.result;
        setInitialPipelineFile(text);
        setDisplayInitialPipelineFileColumnSelection(true);
        setUploadFileName(file.name);
      };

      fileReaderInitialPipelineFile.readAsText(file);
    }
  };

  const handleMarketingInputFileChange = async function (e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      fileReaderMarketingInputFile.onload = function (event) {
        const text = event.target.result;
        MarketingInputFileDataProcessor({
          filebody: text,
          username: username,
          fileName: file.name,
          handleSetUpdate: handleSetUpdate,
        });
      };

      fileReaderMarketingInputFile.readAsText(file);
    }
  };

  // Function to trigger the file input click
  const handleUploadButtonClick = () => {
    setOpen(true);
  };

  const handleOnSelectFileType = async (value) => {
    if (value === "pipelineSummary") {
      // When the "Upload Files" button is clicked, trigger the click event on the hidden file input
      inputRefPipelineSummaryFile.current.click();
    } else if (value === "initialPipeline") {
      inputRefInitialPipelineFile.current.click();
    } else if (value === "marketingInput") {
      inputRefMarketingInputFile.current.click();
    }
  };

  const handleDeleteButtonClick = async () => {
    try {
      const deleteFilePromises = selected.map((id) => {
        return API.graphql(graphqlOperation(deleteFile, { input: { id: id } }));
      });
      await Promise.all(deleteFilePromises);
      setUpdate(!update);
      alertify.success("File(s) deleted successfully");
      setDisplayDeleteButton(false);
    } catch (e) {
      console.log(e);
      alertify.error("Error deleting file(s)");
    }
  };

  // handle close of file type selection dialog
  const handleClose = (value) => {
    setOpen(false);
    setSelectedValue(value);
    handleOnSelectFileType(value);
  };

  const handleInitialPipelineFileColumnSelectionClose = async (value) => {
    setDisplayInitialPipelineFileColumnSelection(false);
    setLoading(true);
    await setAnonymizeColumns(
      value,
      FileAnonymizer({
        username: username,
        filebody: InitialPipelineFile,
        anonymizeColumns: value,
        handleSetUpdate: handleSetUpdate,
        fileName: uploadFileName,
      })
    );
    setLoading(false);
  };

  return (
    <div>
      <div id="files-page-top">
        <div className="manage-files-page-header">
          <h3 className="title">Files</h3>
          <a
            className="template-link"
            href="https://docs.google.com/spreadsheets/d/1BFe5Zd3hNXDDj_UhxXslOETMXakupOt3WtGcI0YQkro/template/preview"
            target="_blank"
          >
            <h5 style={{ marginBottom: "10px", fontSize: "13px" }}>
              {" "}
              Pipeline Summary File Template{" "}
            </h5>
          </a>

          <a
            className="template-link"
            href="https://docs.google.com/spreadsheets/d/1RuXib61NXOudRm36gLRBXacBlbi2bvyhHxIE2oOAxBI/template/preview"
            target="_blank"
          >
            <h5 style={{ marginBottom: "10px", fontSize: "13px" }}>
              {" "}
              Marketing Input File Template{" "}
            </h5>
          </a>
        </div>

        <div className="manage-files-page-buttons">
          {displayDeleteButton && (
            <Button
              color="error"
              variant="contained"
              onClick={() => handleDeleteButtonClick()}
            >
              <DeleteIcon style={{ marginRight: "0.5vw" }} />
              Delete Files
            </Button>
          )}

          <Button variant="contained" onClick={handleUploadButtonClick}>
            <img
              style={{ marginRight: "1vw" }}
              src={UploadLogo}
              alt="Upload Logo"
            />
            Upload File
          </Button>
        </div>

        <FileTypeSelectionDialog
          selectedValue={selectedValue}
          open={open}
          onClose={handleClose}
        />

        <InitialPipelineFileColumnSelection
          file={InitialPipelineFile}
          open={displayInitialPipelineFileColumnSelection}
          onClose={handleInitialPipelineFileColumnSelectionClose}
          selectedValues={anonymizeColumns}
        />

        <input
          type="file"
          ref={inputRefPipelineSummaryFile}
          style={{ display: "none" }}
          onChange={handlePipelineSummaryFileChange}
          accept=".csv"
          id="file-upload"
        />

        <input
          type="file"
          ref={inputRefInitialPipelineFile}
          style={{ display: "none" }}
          onChange={handleInitialPipelineFileChange}
          accept=".csv"
          id="file-upload2"
        />

        <input
          type="file"
          ref={inputRefMarketingInputFile}
          style={{ display: "none" }}
          onChange={handleMarketingInputFileChange}
          accept=".csv"
          id="file-upload3"
        />
      </div>

      <FilesTable
        filesFromDdb={filesFromDdb}
        selected={selected}
        setSelected={setSelected}
        setDisplayDeleteButton={setDisplayDeleteButton}
        setFilesFromDdb={setFilesFromDdb}
      />

      {loading && (
        <Backdrop
          sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={loading}
        >
          <CircularProgress color="inherit" />
        </Backdrop>
      )}
    </div>
  );
};

export default FilesList;
