import React from 'react';
import { Redirect } from 'react-router-dom';
import axios from 'axios';
import uniqid from 'uniqid';
import debounce from 'lodash.debounce';

import PrintPaper from '../../components/PrintPaper';

import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { useSnackbar } from 'notistack';

import Skeleton from '@mui/material/Skeleton';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';

import Table from '../../components/Table';
import TableSkeleton from '../../components/TableSkeleton';

import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Pagination from '@mui/material/Pagination';

import SearchContext from '../../context/SearchContext';
import ImageUpload from '../../components/ImageUpload';
import ChipList from '../../components/ChipList';

import Chip from '@mui/material/Chip';
import { styled } from '@mui/material/styles';
import ReportGmailerrorredIcon from '@mui/icons-material/ReportGmailerrorred';

const Root = styled('div')(({ theme }) => ({
  width: '100%',
  ...theme.typography.body2,
  '& > :not(style) + :not(style)': {
    marginTop: theme.spacing(2),
  },
}));

const Item = props => {
  const [bgColor, setBgColor] = React.useState('white');

  const renderFullName = () => {
    if( (!props?.firstName && !props?.lastname ) || !props?.middleName )
      return 'N/A';

    const middleName = props?.middleName ?? '';

    return (
      props.firstName + ' ' +
      middleName + ' ' +
      props.lastname 
    );
  }

  return(
    <TableRow
      sx={{ backgroundColor: bgColor, transition: '.1s ease-in-out' }} 
      onPointerEnter={() => setBgColor('rgba(0, 0, 0, 0.2)')}
      onPointerLeave={() => setBgColor('white')}
      onDoubleClick={() => props.onClick({ isOpen: true, item: {...props} })}
    >
      <TableCell> { props.studentID } </TableCell>
      <TableCell> { props ? renderFullName() : 'N/A' } </TableCell>
      <TableCell> { props.course + ' ' + props.yearSection } </TableCell>
      {
        props?.openReport 
          ? (
              <TableCell>
                <Button 
                  onClick={() => props.onReport({...props})}
                  onDoubleClick={e => e.stopPropagation()}
                  variant="outlined" 
                  sx={{ color: 'red', borderColor: 'red' }} 
                  startIcon={<ReportGmailerrorredIcon/>}
                >
                  REPORT
                </Button>
              </TableCell>
            )
          : null
      }
    </TableRow>
  );
}


const Dashboard = props => {
  const restorePage = document.body.innerHTML;

	// Fetch user data
  const [head, setHead] = React.useState(['Student ID', 'Student Name', 'Course / Year / Section']);
	const [accounts, setAccounts] = React.useState( [] );
  const [items, setItems] = React.useState( [] );
  const [editForm, setEditForm] = React.useState({ isOpen: false, item: null });
  const [selected, setSelected] = React.useState( null );
  const [incidentNumber, setIncidentNumber] = React.useState( null );

  const search = React.useContext( SearchContext );
  
  const incrementIncidentNumber = () => {
    setIncidentNumber( incidentNumber => incidentNumber + 1 );
  }

  React.useEffect(() => {
    let renderedItem = [];

    accounts.forEach( acc => {
      if( acc.studentID.searchContain( search ) ){
        renderedItem.push( 
          <Item
            key={uniqid()}
            openReport={props?.role === 'adminstaff'}
            onClick={setEditForm}
            onReport={data => setSelected( data )}
            {...acc}
          />
        );
      }
    });

    setItems([...renderedItem]);
  }, [accounts, search]);

  const fetchIncidentNumber = async() => {
    axios.get('http://localhost:3000/incident-number')
    .then( res => {
      setIncidentNumber( res.data );
    })
    .catch( err => {
      throw err;
    });
  }

	const fetchStudentData = async() => {
    axios.get('http://localhost:3000/student-data')
    .then( res => {
      if( res.data ){
        const modifiedData = res.data.map( datum => ({ id: datum._id, ...datum}));
        setAccounts( modifiedData );
      }
    })
    .catch( err => {
      throw err;
    });
  }

  const setOpen = () => {
    setEditForm({ isOpen: false, item: null });
  }

	React.useEffect(() => {
    fetchStudentData();
    if( props?.role && props?.role === 'adminstaff' ){
      setHead(head => [...head, 'Report']);
    }
	}, []);

  React.useEffect(() => fetchIncidentNumber(), []);

	return(
		<div style={{ width: '100%', height: 'fit-content' }}>
      <div style={{ width: '100%', height: '100%' }} className="d-flex flex-column justify-content-center align-items-start p-1">
        <Table
          style={{ width: '100%' }}
          maxHeight={ 500 }
          head={head}
          content={ items }
        />
        <StudentForm restorePage={restorePage} setOpen={setOpen} item={editForm.item} isOpen={editForm.isOpen}/>
        { 
          selected 
            ? <MakeReportForm 
                data={selected} 
                setOpen={() => setSelected( null )} 
                isOpen={ selected ? true : false }
                incidentNumber={ incidentNumber }
                incrementIncidentNumber={incrementIncidentNumber}
              /> 
            : null 
        }
      </div>
		</div>
	);
}

const StudentForm = props => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const [printPaper, setPrintPaper] = React.useState( null );
  const [reportData, setReportData] = React.useState( null );
  const [reports, setReports] = React.useState( [] );
  const [page, setPage] = React.useState( 1 );

  const fetchStudentReport = async () => {
    if( !props.item ) return;

    axios.get(`http://localhost:3000/student-report/${ props.item.studentID }`)
    .then( res => {
      setReportData( res.data );
    })
    .catch( err => {
      if( err?.response?.status ){
        switch( err?.response?.status ){
          case 404:
            props.setOpen();
            enqueueSnackbar( 'This student does not have a report yet.', { variant: 'warning' });       
            break;

          default:
            enqueueSnackbar( 'An error occured, please try again!', { variant: 'error' });       
            break;
        }
      }
      
      throw err;
    });
  } 

  React.useEffect(() => {
    if( reportData ){
      reportData?.report?.forEach?.((rep, index) => {
        // if( !rep?.semester && !rep?.duty?.length &&
        //     !rep?.incidentDescription && !rep?.majorProblemBehavior?.length &&
        //     !rep?.initialActionGiven && !rep?.administrativeDecision?.length &&
        //     !rep?.administrativeComment
        //   ) 
        //   return;

        setReports( reports => [ ...reports, (
            <div key={uniqid()}>
                <Stack direction="column" spacing={2}>
                  {
                    rep?.semester 
                      ? <TextField
                            disabled 
                            id="outlined-basic"
                            label={`Duty - ${ rep.semester }`} 
                            variant="outlined" 
                            defaultValue={rep?.duty?.length ? rep?.duty?.join?.(', ') : ' ' }
                        />
                      : null
                  }

                  {
                    rep?.semester 
                      ? <TextField
                          disabled 
                          id="outlined-basic" 
                          label="Report" 
                          variant="outlined" 
                          defaultValue={rep?.incidentDescription}
                        />
                      : null
                  }

                  {
                    rep?.images && rep?.images?.length
                      ? (
                          <div className="container-fluid">
                            <Stack direction="column">
                              <div className="col-12">
                                <p><b>Evidence</b></p>
                              </div>
                              <div className="col-12 d-flex justify-content-center align-items-center">
                                <img 
                                  style={{ 
                                    imageRendering: 'pixelated', 
                                    width: '50%', 
                                    height: '50%' 
                                  }} 
                                  src={rep.images[0]} 
                                  alt="Evidence"
                                />
                              </div>
                            </Stack>
                          </div>
                        )
                      : (
                          <div className="container-fluid text-center">
                            <p> NO EVIDENCE </p>
                          </div>
                        )
                  }

                  {
                    rep?.semester 
                      ? <TextField
                          disabled 
                          id="outlined-basic" 
                          label="Semester" 
                          variant="outlined" 
                          defaultValue={rep?.semester}
                        />
                      : null
                  }

                  {
                    rep?.majorProblemBehavior?.length && rep?.semester
                      ? <Root>
                          <Divider textAlign="left">
                            <Chip label={`GRIEVANCE - ${ rep.semester }`}/>
                          </Divider>
                        </Root>
                      : null
                  }
                  
                  {
                    rep?.majorProblemBehavior?.length
                      ? <TextField
                          disabled 
                          id="outlined-basic" 
                          label={`Major Problem Behavior`} 
                          variant="outlined" 
                          defaultValue={rep?.majorProblemBehavior?.join?.(', ')}
                        />
                      : null
                  }

                  {
                    rep?.initialActionGiven
                      ? <TextField
                          disabled 
                          id="outlined-basic" 
                          label={`Initial Action Given`} 
                          variant="outlined" 
                          defaultValue={rep?.initialActionGiven}
                        />
                      : null
                  }

                  {
                    rep?.administrativeDecision?.length
                      ? <TextField
                          disabled 
                          id="outlined-basic" 
                          label={`Administrative Decision`} 
                          variant="outlined" 
                          defaultValue={rep?.administrativeDecision}
                        />
                      : null
                  }

                  {
                    rep?.administrativeComment
                      ? <TextField
                          disabled 
                          id="outlined-basic" 
                          label={`Administrative Comment`} 
                          variant="outlined" 
                          defaultValue={rep?.administrativeComment}
                        />
                      : null
                  }
                  <div className="container-fluid d-flex justify-content-center align-items-center">
                    <Button 
                      variant="outlined" 
                      onClick={() => {
                        window.open(`/print-student-report/${reportData?.student?.studentID}/reportIndex/${index}`, '_blank');
                      }}
                    >
                      print
                    </Button>
                  </div>
                  <Divider/>
              </Stack>
            </div>
          )]);
      });
    }
    else{
      setReports( [] );
    }
  }, [reportData]);

  React.useEffect(() => fetchStudentReport(), [props.item]);

  return(
    <Dialog
      fullScreen={fullScreen}
      open={ props.isOpen }
      onClose={ () => {
        setReportData( null );
        setReports( [] );
        props.setOpen();
      }}
      maxWidth="md"
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">
        {"You are viewing " + (reportData?.student?.firstName ?? '') + "'s data"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          You are not allowed to modify these data.
        </DialogContentText>
        <Box
          component="form"
          sx={{
            '& > :not(style)': { m: 1, width: '500px' },
          }}
          noValidate
          autoComplete="off"
          > 
            <Stack spacing={3}>
              {
                reportData
                  ? (
                    <>
                      <TextField
                        disabled 
                        id="outlined-basic" 
                        label="Student ID" 
                        variant="outlined" 
                        defaultValue={reportData?.student?.studentID}
                      />
                      <TextField
                        disabled 
                        id="outlined-basic" 
                        label="Year" 
                        variant="outlined" 
                        defaultValue={reportData?.student?.yearSection}
                      />
                      <Divider/>
                    </>
                  )
                  : null
              }
              {
                reports.length
                  ? (
                      <>
                        { reports[ page - 1 ] }
                        <div className="col-12 d-flex justify-content-center align-items-center">
                          <Pagination count={ reports.length } page={ page } onChange={(_, value) => setPage( value )}/>
                        </div>
                      </>
                    )
                  : null
              }
            </Stack>
          </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          autoFocus 
          onClick={() => {
            setReportData( null );
            setReports( [] );
            props.setOpen();
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const label = { inputProps: { 'aria-label': 'Checkbox violation' } };

const renderDate = date => {
  if( !date ) return '';

  const _parsedDate = new Date( date );
  const _date = _parsedDate.getDate();
  const _month = _parsedDate.getMonth() + 1;
  const _year = _parsedDate.getFullYear();

  return `${_year}-${_month}-${_date}`;
}

const dateNow = () => {
  let date = new Date();

  return renderDate( date );
}

const MakeReportForm = props => {
  const { enqueueSnackbar } = useSnackbar();

  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [button, setButton] = React.useState({ msg: 'Submit', isDisabled: false });
  
  const [otherMinor, setOtherMinor] = React.useState( '' );
  const [otherMajor, setOtherMajor] = React.useState( '' );
  const [otherDecision, setOtherDecision] = React.useState( '' );
  const [image, setImage] = React.useState( null );
  
  const renderFullName = () => {
    if( !props?.data?.firstName && !props?.data?.lastname )
      return null;

    const middleName = props?.data?.middleName ?? '';

    return (
      props?.data?.firstName + ' ' +
      middleName + ' ' +
      props?.data?.lastname 
    );
  }

  const renderCourseYrSection = () => {
    if( !props?.data?.course || !props?.data?.yearSection)
      return null;

    return props?.data?.course + ' ' + props?.data?.yearSection;
  }

  const initState = {
    studentID: props?.data?.studentID ?? '',
    semester: '1st semester',
    reportedBy: '', 
    role: '', 
    duty: [],
    dateOfReport: dateNow() ?? '', 
    incidentNo: props?.incidentNumber, 
    studentName: renderFullName() ?? '', 
    dateOfIncident: '', 
    courseYrSection: renderCourseYrSection() ?? '', 
    timeOfIncident: '', 
    location: '', 
    specificAreaLocation: '', 
    additionalPersonInvolved: '', 
    witnesses: '', 
    incidentDescription: '', 
    images: [],
    descriptionOfUnacceptable: '',
    resultingActionExecuted: '',
    employeeName: '',
    date1: dateNow() ?? '',
    chairpersonName: '',
    date2: dateNow() ?? '',
    majorProblemBehavior: [],
    initialActionGiven: '',
    administrativeDecision: [],
    administrativeComment: '',
  }

  const reducer = (state, action) => {
    switch( action.type ){
      case 'studentID':
        state.studentID = action.data;
        return state;

      case 'semester':
        state.semester = action.data;
        return state;

      case 'reportedBy':
        state.reportedBy = action.data;
        return state;

      case 'role':
        state.role = action.data;   
        return state;

      case 'duty':
        state.duty = action.data;
        return state;

      case 'dateOfReport':
        state.dateOfReport = renderDate(action.data);
        return state;

      case 'incidentNo':
        state.incidentNo = action.data;
        return state;

      case 'studentName':
        state.studentName = action.data;
        return state;

      case 'dateOfIncident':
        state.dateOfIncident = action.data;
        return state;

      case 'courseYrSection':
        state.courseYrSection = action.data;
        return state;

      case 'timeOfIncident':
        state.timeOfIncident = action.data;
        return state;

      case 'location':
        state.location = action.data;
        return state;

      case 'specificAreaLocation':
        state.specificAreaLocation = action.data;
        return state;

      case 'additionalPersonInvolved':
        state.additionalPersonInvolved = action.data;
        return state;

      case 'witnesses':
        state.witnesses = action.data;
        return state;

      case 'incidentDescription':
        state.incidentDescription = action.data;
        return state;

      case 'images':      
        state.images = action.data ? ['/images/reports/' + action.data.name] : [];
        return state;

      case 'descriptionOfUnacceptable':
        state.descriptionOfUnacceptable = action.data;
        return state;

      case 'resultingActionExecuted':
        state.resultingActionExecuted = action.data;
        return state;

      case 'employeeName':
        state.employeeName = action.data;
        return state;

      case 'date1':
        state.date1 = renderDate( action.data );
        return state;

      case 'chairpersonName':
        state.chairpersonName = action.data;
        return state;

      case 'date2':
        state.date2 = renderDate( action.data );
        return state;

      case 'majorProblemBehavior':
        state.majorProblemBehavior = action.data;
        return state;

      case 'initialActionGiven':      
        state.initialActionGiven = action.data;
        return state;

      case 'administrativeDecision':
        state.administrativeDecision = action.data;
        return state;

      case 'administrativeComment':
        state.administrativeComment = action.data;
        return state;

      default:
        return state;
    }
  }

  const handleSubmitReport = async() => {
    setButton({ msg: 'Loading', isDisabled: true });

    if( otherMajor.length ){
      dispatch({ type: 'majorProblemBehavior', data: [...state.majorProblemBehavior, otherMajor] });
    }

    if( otherDecision.length ){
      dispatch({ type: 'administrativeDecision', data: [...state.administrativeDecision, otherDecision] });
    }

    setTimeout(() => {
      if( state.studentID.length ){
        axios.post('http://localhost:3000/save-report', state)
        .then( async res => {
          if( image ){
            const formData = new FormData();
            formData.append('reportImage', image );

            try{
              await axios.post(`http://localhost:3000/save-report-image`, formData)
            }
            catch( err ){
              throw err;
            }       
          }

          props?.incrementIncidentNumber?.();
          enqueueSnackbar( res.data.message, { variant: 'success' });
        })
        .catch( err => {
          enqueueSnackbar( err?.response?.data?.message ?? 'Please try again', { variant: 'error' });
        });
      }
      else{
        enqueueSnackbar( 'Student ID is required', { variant: 'error' });
      }

      props.setOpen();
      setButton({ msg: 'Submit', isDisabled: false });
    }, 1000);
  }

  const handleMajorProblemBehavior = (e, value) => {
    const label = e.target.labels[0].innerText;
    const labelExists = state.majorProblemBehavior.includes( label );

    if( labelExists && !value ){
      const newList = state.majorProblemBehavior.filter( val => val !== label );
      dispatch({ type: 'majorProblemBehavior', data: newList });
    }
    else if( !labelExists && value ){
      const newList = state.majorProblemBehavior;
      newList.push( label );

      dispatch({ type: 'majorProblemBehavior', data: newList });
    }
  }

  // const handleMinorProblemBehavior = (e, value) => {
  //  const label = e.target.labels[0].innerText;
  //  const labelExists = state.minorProblemBehavior.includes( label );

  //  if( labelExists && !value ){
  //    const newList = state.minorProblemBehavior.filter( val => val !== label );
  //    dispatch({ type: 'minorProblemBehavior', data: newList });
  //  }
  //  else if( !labelExists && value ){
  //    const newList = state.minorProblemBehavior;
  //    newList.push( label );

  //    dispatch({ type: 'minorProblemBehavior', data: newList });
  //  }
  // }

  const handleAdministrativeDecision = (e, value) => {
    const label = e.target.labels[0].innerText;
    const labelExists = state.administrativeDecision.includes( label );

    if( labelExists && !value ){
      const newList = state.administrativeDecision.filter( val => val !== label );
      dispatch({ type: 'administrativeDecision', data: newList });
    }
    else if( !labelExists && value ){
      const newList = state.administrativeDecision;
      newList.push( label );

      dispatch({ type: 'administrativeDecision', data: newList });
    }
  }

  const [state, dispatch] = React.useReducer( reducer, initState );

  return(
    <Dialog
      fullScreen={fullScreen}
      open={ props.isOpen }
      onClose={ () => {
        // setReportData( null );
        // setReports( [] );
        props.setOpen();
      }}
      maxWidth="xl"
      aria-labelledby="responsive-dialog-title"
    >
      <DialogTitle id="responsive-dialog-title">
        {"REPORT " + props?.data?.lastname?.toUpperCase?.() }
      </DialogTitle>
      <DialogContent>
        {/*insert content here*/}
        <div style={{ width: '100%', height: '100%' }} className="p-4">
          <div style={{ width: '100%', height: '90%', overflowY: 'auto', backgroundColor: 'rgba(255, 255, 255, 0.8)' }} className="p-3 rounded d-flex flex-column align-items-center">
            <div className="col-12 px-5 d-flex flex-row justify-content-start align-items-center">
              <img id="discipline-logo" src="images/discipline.png" alt="discipline office logo"/>
              <div className="col-12 d-flex flex-column justify-content-start align-items-start p-5">
                <h4 className="text-uppercase">city college of tagaytay</h4>
                <h1 className="text-uppercase">student incident report</h1>
              </div>
            </div>
            <div className="container-fluid">
              <Divider/>
            </div>
            <div className="row container-fluid d-flex justify-content-around align-items-center">
              <div className="col-md-6 d-flex justify-content-center align-items-center my-5">
                <Stack spacing={2}>
                  <TextField sx={{ width: '300px' }} label="Reported By" onChange={e => dispatch({ type: 'reportedBy', data: e.target.value })} variant="standard"/>
                  <TextField sx={{ width: '300px' }} label="Title/Role" onChange={e => dispatch({ type: 'role', data: e.target.value })} variant="standard"/>
                </Stack>
              </div>
              <div className="col-md-6 d-flex justify-content-center align-items-center my-5">
                <Stack spacing={2}>
                  <TextField disabled sx={{ width: '300px' }} defaultValue={state.dateOfReport} helperText="Date of Report" onChange={e => dispatch({ type: 'dateOfReport', data: e.target.value })} type="date" variant="standard"/>
                  <TextField disabled sx={{ width: '300px' }} defaultValue={state.incidentNo} label="Incident no." onChange={e => dispatch({ type: 'incidentNo', data: e.target.value })} type="number" variant="standard"/>
                </Stack>
              </div>
            </div>
            
            <div style={{ color: 'white' }} className="col-11 bg-dark py-1 d-flex justify-content-center align-items-center rounded">
              <h6 className="text-uppercase p-0 m-0">
                student incident information
              </h6>
            </div>

            <div className="row container-fluid d-flex justify-content-around align-items-center">
              <div className="col-md-6 d-flex justify-content-center align-items-center my-5">
                <Stack spacing={2}>
                  <TextField disabled sx={{ width: '300px' }} defaultValue={state.studentName} onChange={e => dispatch({ type: 'studentName', data: e.target.value })} label="Student Name" variant="standard"/>
                  <TextField sx={{ width: '300px' }} onChange={e => dispatch({ type: 'dateOfIncident', data: e.target.value })} helperText="Date of Incident" type="date" variant="standard"/>
                </Stack>
              </div>
              <div className="col-md-6 d-flex justify-content-center align-items-center my-5">
                <Stack spacing={2}>
                  <TextField disabled sx={{ width: '300px' }} defaultValue={state.courseYrSection} onChange={e => dispatch({ type: 'courseYrSection', data: e.target.value })} label="Course / Yr / Section" variant="standard"/>
                  <TextField sx={{ width: '300px' }} onChange={e => dispatch({ type: 'timeOfIncident', data: e.target.value })} label="Time of Incident" variant="standard"/>
                </Stack>
              </div>
            </div>

            <div className="row d-flex flex-column justify-content-center align-items-center mb-5">
              <div className="col-md-12 d-flex justify-content-start align-items-start">
                <TextField disabled sx={{ width: '300px', margin: '10px' }} defaultValue={state.studentID} required onChange={e => dispatch({ type: 'studentID', data: e.target.value })} label="Student ID" variant="standard"/>
              </div>

              <div className="col-md-12 d-flex justify-content-start align-items-start">
                <Autocomplete
                    defaultValue={state.semester}
                    sx={{ width: '300px', margin: '10px' }}
                    options={['1st semester', '2nd semester']}
                    onChange={(e, data) => dispatch({ type: 'semester', data })}
                    onInputChange={(e, data) => dispatch({ type: 'semester', data })}
                    renderInput={ params => <TextField { ...params} label="Semester" variant="standard"/> }
                  />
              </div>

              <div className="col-md-12">
                <ChipList 
                  label="Add Duty"
                  getValues={ data => dispatch({ type: 'duty', data: data ? data : [] })}
                />
              </div>

              <div className="col-md-12 d-flex justify-content-center align-items-center">
                <TextField sx={{ width: '80vw', margin: '10px' }} onChange={e => dispatch({ type: 'location', data: e.target.value })} label="Location" variant="standard"/>
              </div>

              <div className="col-md-12 d-flex justify-content-center align-items-center">
                <TextField sx={{ width: '80vw', margin: '10px' }} onChange={e => dispatch({ type: 'specificAreaLocation', data: e.target.value })} label="Specific Area of Location" variant="standard"/>
              </div>

              <div className="col-md-12 d-flex justify-content-center align-items-center">
                <TextField sx={{ width: '80vw', margin: '10px' }} onChange={e => dispatch({ type: 'additionalPersonInvolved', data: e.target.value })} label="Additional Person(s) Involved" variant="standard"/>
              </div>

              <div className="col-md-12 d-flex justify-content-center align-items-center">
                <TextField sx={{ width: '80vw', margin: '10px' }} onChange={e => dispatch({ type: 'witnesses', data: e.target.value })} label="Witnesses" variant="standard"/>
              </div>
            </div>

            <div className="d-flex flex-column justify-content-between align-items-center">
              <TextField
                sx={{ width: '80vw', margin: '50px' }}
                id="standard-multiline-flexible"
                label="Incident Description"
                multiline
                rows={10}
                maxRows={4}
                onChange={e => dispatch({ type: 'incidentDescription', data: e.target.value })}
                variant="filled"
              />

              <Root>
                <Divider textAlign="left">
                  <Chip label="UPLOAD IMAGE"/>
                </Divider>
              </Root>
              
              <ImageUpload imageLimit={1} getImages={ data => {
                dispatch({ type: 'images', data: data?.[0] });
                setImage( data?.[0] );
              }}/>  
              <br/>

              <Root>
                <Divider/>
              </Root>

              <TextField
                sx={{ width: '80vw', margin: '50px' }}
                id="standard-multiline-flexible"
                label="Description of Unacceptable / Unsafe Behavior or Conditions (If applicable)"
                multiline
                rows={10}
                maxRows={4}
                onChange={e => dispatch({ type: 'descriptionOfUnacceptable', data: e.target.value })}
                variant="filled"
              />

              <TextField
                sx={{ width: '80vw', margin: '50px' }}
                id="standard-multiline-flexible"
                label="Resulting Action Executed or Planned"
                multiline
                rows={10}
                maxRows={4}
                onChange={e => dispatch({ type: 'resultingActionExecuted', data: e.target.value })}
                variant="filled"
              />
            </div>

            <div className="row container-fluid d-flex flex-column justify-content-center align-items-center">
              <div className="row col-12 d-flex flex-row justify-content-around align-items-center m-3">
                <div className="col-md-4 d-flex justify-content-center  align-items-center">
                  <TextField sx={{ width: '7cm', margin: '5px' }} onChange={e => dispatch({ type: 'employeeName', data: e.target.value })} label="Faculty / Employee Name" variant="standard"/>
                </div>

                <div className="col-md-4 d-flex justify-content-center align-items-center">
                  <TextField disabled sx={{ width: '7cm', margin: '5px' }} defaultValue={state.date1} onChange={e => dispatch({ type: 'date1', data: e.target.value })} helperText="Date" type="date" variant="standard"/>
                </div>
              </div>

              <div className="row col-12 d-flex flex-row justify-content-around align-items-center m-3">
                <div className="col-md-5 d-flex justify-content-center align-items-center">
                  <TextField sx={{ width: '7cm', margin: '5px' }} onChange={e => dispatch({ type: 'chairpersonName', data: e.target.value })} label="Head / Chairperson Name" variant="standard"/>
                </div>

                <div className="col-md-5 d-flex justify-content-center align-items-center">
                  <TextField disabled sx={{ width: '7cm', margin: '5px' }} defaultValue={state.date2} onChange={e => dispatch({ type: 'date2', data: e.target.value })} helperText="Date" type="date" variant="standard"/>
                </div>
              </div>
            </div>

            <div className="col-12">
              <Root>
                  <Divider textAlign="left">
                    <Chip label="GRIEVANCE"/>
                  </Divider>
              </Root>
            </div>

            <div className="mt-5 row d-flex flex-row justify-content-center align-items-center mb-5">
              <div className="col-md-12 px-5 d-flex justify-content-start align-items-start">
                <h5 className="text-uppercase"><b>problem behavior:</b></h5>
              </div>

              {/*<div className="px-5 col-md-5 my-3 d-flex flex-column justify-content-between align-items-start">
                <div className="col-12">
                  <p className="text-uppercase">minors:</p>
                </div>

                <FormControlLabel
                  label="Not wearing prescribed school uniform"
                  control={<Checkbox onChange={handleMinorProblemBehavior} {...label}/>}
                />
                
                <FormControlLabel
                  label="Not wearing I.D"
                  control={<Checkbox onChange={handleMinorProblemBehavior} {...label}/>}
                />

                <FormControlLabel
                  label="Dress Code"
                  control={<Checkbox onChange={handleMinorProblemBehavior} {...label}/>}
                />

                <FormControlLabel
                  label="Using vulgar words and rough behavior"
                  control={<Checkbox onChange={handleMinorProblemBehavior} {...label}/>}
                />

                <FormControlLabel
                  label="Loitering"
                  control={<Checkbox onChange={handleMinorProblemBehavior} {...label}/>}
                />

                <FormControlLabel
                  label="Littering"
                  control={<Checkbox onChange={handleMinorProblemBehavior} {...label}/>}
                />

                <FormControlLabel
                  label="Careless / unauthorized use of school property "
                  control={<Checkbox onChange={handleMinorProblemBehavior} {...label}/>}
                />

                <FormControlLabel
                  label="Unauthorized posting of announcements, posters and notices."
                  control={<Checkbox onChange={handleMinorProblemBehavior} {...label}/>}
                />

                <OtherCheckBox onChange={value => setOtherMinor( value )}/>
              </div>*/}

              {/*================================================================================*/}

              <div className="px-5 row col-md-12 my-3 d-flex flex-column justify-content-center align-items-center">
                <div className="col-md-12">
                  <p className="text-uppercase">majors: (Automatic Office Referral)</p>
                </div>

                <div className="row container-fluid">
                  <div className="col-md-6">
                    <FormControlLabel
                      label="Using another persons, ID/COR, lending of ID/COR"
                      control={<Checkbox onChange={handleMajorProblemBehavior} {...label}/>}
                    />
                  </div>

                  <div className="col-md-6">
                    <FormControlLabel
                      label="Forging, Falsifying or Tampering of any Academic, Official Records of Documents"
                      control={<Checkbox onChange={handleMajorProblemBehavior} {...label}/>}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormControlLabel
                      label="Unauthorized possession of examination materials, and other documents"
                      control={<Checkbox onChange={handleMajorProblemBehavior} {...label}/>}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormControlLabel
                      label="Having somebody else take an examination for another"
                      control={<Checkbox onChange={handleMajorProblemBehavior} {...label}/>}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormControlLabel
                      label="Cheating during examination"
                      control={<Checkbox onChange={handleMajorProblemBehavior} {...label}/>}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormControlLabel
                      label="Plagiarism"
                      control={<Checkbox onChange={handleMajorProblemBehavior} {...label}/>}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormControlLabel
                      label="Grave act of disrespect"
                      control={<Checkbox onChange={handleMajorProblemBehavior} {...label}/>}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormControlLabel
                      label="Involvement in any form of attack to other person"
                      control={<Checkbox onChange={handleMajorProblemBehavior}{...label}/>}
                    />
                  </div>
                  <div className="col-md-6">
                    <FormControlLabel
                      label="Bullying in any form"
                      control={<Checkbox onChange={handleMajorProblemBehavior}{...label}/>}
                    />
                  </div>
                  <div className="col-md-6">
                    <OtherCheckBox onChange={value => setOtherMajor( value )}/>
                  </div>
                </div>
              </div>      
            </div>
            <div className="row container-fluid d-flex flex-column justify-content-center align-items-center">
              <div className="col-md-12 px-5 d-flex justify-content-start align-items-start">
                <h5 className="text-uppercase"><b>administrative decision:</b></h5>
              </div>
              <div className="row col-md-12">
                <div className="col-md-4">
                  <FormControlLabel
                    label="Conference w/ student "
                    control={<Checkbox onChange={handleAdministrativeDecision} {...label}/>}
                  />
                </div>

                <div className="col-md-4">
                  <FormControlLabel
                    label="Parent contact"
                    control={<Checkbox onChange={handleAdministrativeDecision} {...label}/>}
                  />
                </div>

                <div className="col-md-4">
                  <FormControlLabel
                    label="Detention"
                    control={<Checkbox onChange={handleAdministrativeDecision} {...label}/>}
                  />
                </div>

                <div className="col-md-4">
                  <FormControlLabel
                    label="Community Service"
                    control={<Checkbox onChange={handleAdministrativeDecision} {...label}/>}
                  />
                </div>

                <div className="col-md-4">
                  <FormControlLabel
                    label="Oral Reprimand / Written Apology from the Students"
                    control={<Checkbox onChange={handleAdministrativeDecision} {...label}/>}
                  />
                </div>

                <div className="col-md-4">
                  <FormControlLabel
                    label="Oral and Written Reprimand / Written Apology from the Students and Counselling"
                    control={<Checkbox onChange={handleAdministrativeDecision} {...label}/>}
                  />
                </div>

                <div className="col-md-4">
                  <FormControlLabel
                    label="Suspension"
                    control={<Checkbox onChange={handleAdministrativeDecision} {...label}/>}
                  />
                </div>

                <div className="col-md-4">
                  <FormControlLabel
                    label="Dismissal"
                    control={<Checkbox onChange={handleAdministrativeDecision} {...label}/>}
                  />
                </div>

                <div className="col-md-4">
                  <FormControlLabel
                    label="Exclusion"
                    control={<Checkbox onChange={handleAdministrativeDecision} {...label}/>}
                  />
                </div>

                <div className="col-md-4">
                  <FormControlLabel
                    label="Expulsion"
                    control={<Checkbox onChange={handleAdministrativeDecision} {...label}/>}
                  />
                </div>

                <div className="col-5">
                  <OtherCheckBox onChange={value => setOtherDecision( value )}/>
                </div>
              </div>
            </div>
            
            <div className="col-12 d-flex justify-content-center align-items-center">
              <TextField
                sx={{ width: '80vw', margin: '50px' }}
                id="standard-multiline-flexible"
                label="Initial Action Given"
                multiline
                rows={10}
                // maxRows={4}
                onChange={e => dispatch({ type: 'initialActionGiven', data: e.target.value })}
                variant="filled"
              />
            </div>

            <div className="col-12 d-flex justify-content-center align-items-center">
              <TextField
                sx={{ width: '80vw', margin: '50px' }}
                id="standard-multiline-flexible"
                label="Administrative Comments and/or Follow Up:"
                multiline
                rows={10}
                // maxRows={4}
                onChange={e => dispatch({ type: 'administrativeComment', data: e.target.value })}
                variant="filled"
              />
            </div>

            <div className="d-flex justify-content-around align-items-center my-5">
              <Button disabled={button.isDisabled} variant="outlined" color="success" sx={{ width: '150px' }} onClick={() => handleSubmitReport()}>
                { button.msg }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button 
          autoFocus 
          onClick={() => {
            // setReportData( null );
            // setReports( [] );
            props.setOpen();
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const OtherCheckBox = props => {
  const [isChecked, setIsChecked] = React.useState( false );
  const [value, setValue] = React.useState('');
  const [key, setKey] = React.useState( props?.key );

  const handleChecked = e => {
    setIsChecked( e.target.checked );
  }

  const handleOnChange = e => {
    setValue( e.target.value );
  }

  const debouncedValuePassing = debounce(props?.onChange, 1000);

  React.useEffect(() => {
    if( !isChecked ){
      setValue( '' );
    }

    if( isChecked && !value.length ){
      props?.isEmpty?.( true );
    }
    else if( isChecked && value.length ){
      props?.isEmpty?.( false );
    }

    debouncedValuePassing?.( value, key );

  }, [isChecked, value]);

  return(
    <FormControlLabel
      label={
        <TextField 
          disabled={!isChecked} 
          value={value} 
          onChange={handleOnChange} 
          label="Other" 
          variant="standard"
          helperText={ isChecked ? 'Enter text here' : '' }
        />
      }
      control={<Checkbox checked={isChecked} onChange={handleChecked} {...label}/>}
    />
  );
}


export default Dashboard;