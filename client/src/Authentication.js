import React from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { Route, Switch, Redirect } from 'react-router-dom';

import LinearProgress from '@mui/material/LinearProgress';
import { SnackbarProvider } from 'notistack';

import PrintPaper from './components/PrintPaper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';

import OutlinedInput from '@mui/material/OutlinedInput';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

import 'bootstrap/dist/css/bootstrap.min.css';

import cctLogo from './images/cct-logo.ico';

const Admin = React.lazy(() => import('./view/Admin'));
const Student = React.lazy(() => import('./view/Student'));
const SystemAdmin = React.lazy(() => import('./view/System-Admin'));
const AdministrativeStaff = React.lazy(() => import('./view/Administrative-Staff'));

const ROOT = '/';
const VIEWS = [
	ROOT + 'sign-in',
	ROOT + 'admin',
	ROOT + 'student',
	ROOT + 'system-admin',
	ROOT + 'administrative-staff'
];


const Authentication = props => {
	const path = new Path( window.location.pathname );

	const [allow, setAllow] = React.useState( null );
	const [view, setView] = React.useState( null );
	const [role, setRole] = React.useState( '' );
	const [name, setName] = React.useState( '' );

	const setToThisView = ( viewPath ) => {
	    setView(() => <Redirect to={viewPath} />);
	    runAuth();
	}

	const tools = {
		setView: setToThisView,
		setAllow,
		setRole,
		role,
		name,
	}


	const runAuth = () => {
	    const token = Cookies.get('token');
	    const rtoken = Cookies.get('rtoken');

	    axios.get(`http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/verify-me`, {
	      headers: {
	        'authorization': `Bearer ${ token }`
	      }
	    })
	    .then( res => {
	    	console.log( res.data.username );
	      setName( res.data.username );
	      setRole( res.data.role );
	      setAllow(() => true);
	    })
	    .catch( err => {
	      axios.post(`http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/auth/refresh-token`, { rtoken })
	      .then( res => {
	        Cookies.set('token', res.data.accessToken);
	        runAuth();
	      })
	      .catch( err => setAllow(() => false));
	    });
	}


	React.useEffect(() => {
	    setAllow(() => null);
	    runAuth();
	}, []);


	React.useEffect(() => {
	    if( allow ){
	      switch( path.pathname ){
	        case '/admin':
	        	if( role !== 'admin' ) return;
	          
	          setToThisView( path.pathname );
	          break;

	        case '/student':
	        	if( role !== 'student' ) return;

	          setToThisView( path.pathname );
	          break;

	        case '/administrative-staff':
	        	if( role !== 'adminstaff' ) return;
	          
	          setToThisView( path.pathname );
	          break;

					case '/system-admin':
	        	if( role !== 'sysadmin' ) return;
	          
	          setToThisView( path.pathname );
	          break;

	        default:
	        	if( path.pathname.indexOf('/print-student-report') === 0 ){
		          setToThisView( path.pathname );
	        	}
	        	else if( role === 'admin' ){
		          setToThisView( '/admin' );
	        	}
	        	else if( role === 'sysadmin' ){
		          setToThisView( '/system-admin' );
	        	}
	        	else if( role === 'adminstaff' ){
		          setToThisView( '/administrative-staff' );
	        	}
	        	else if( role === 'student' ){
		          setToThisView( '/student' );
	        	}
	          break;
	      }     
	      // return setAllow(() => null);
	    }
	    else if( allow === false ){
	      switch( path.pathname ){
	        case '/sign-in':
	          setToThisView( path.pathname );
	          break;

	        default:
	          setToThisView( '/sign-in' );
	          break;
	      }
	      // return setAllow(() => null);
	    }
	}, [allow, role]);

	return(
		<SnackbarProvider maxSnack={3}>
	      <div className="App">
	        <React.Suspense fallback={<Loading/>}>      
	          <Switch>
	            {
	              allow 
	                ? (
	                    <>
	                    	{
	                    		role !== 'student'
	                    			? (
		                    				<Route exact path="/print-student-report/:studentID/reportIndex/:reportIndex">
						                      <PrintPaper/>
						                    </Route>
					                    )
					                  : null
	                    	}

	                      <Route exact path="/admin">
	                        <Admin tools={tools}/>
	                      </Route>

	                      <Route exact path="/administrative-staff">
	                        <AdministrativeStaff tools={tools} />
	                      </Route>

	                      <Route exact path="/system-admin">
	                        <SystemAdmin tools={tools} />
	                      </Route>

	                      <Route exact path="/student">
	                        <Student tools={tools}/>
	                      </Route>
	                    </>
	                  )
	                : (
		                	<Route path="/sign-in">
	                      <SignIn tools={tools}/>
	                    </Route>
                    )
	            }
	          </Switch>
	          { view }
	        </React.Suspense>
	      </div>
	    </SnackbarProvider>
	);
}

const SignIn = props => {
	const [user, setUser] = React.useState({ username: '', password: '', showPassword: false });
	const [signingIn, setSigningIn] = React.useState( false );
	const [role, setRole] = React.useState( props.role ?? 'student' );
	const [btnMsg, setBtnMsg] = React.useState('sign me in');
	const [errMsg, setErrMsg] = React.useState( null );

	const unameField = React.useRef( null );
	const passField = React.useRef( null );

	const handleClickShowPassword = () => {
		setUser({
		  ...user,
		  showPassword: !user.showPassword,
		});
	};

	const handleMouseDownPassword = event => {
		event.preventDefault();
	};

	const setUsername = e => {
		setUser(user => ({
			username: e.target.value,
			password: user.password,
			showPassword: user.showPassword
		}));
	}

	const setPassword = e => {
		setUser(user => ({
			username: user.username,
			password: e.target.value,
			showPassword: user.showPassword
		}));
	}

	const handleSignin = async () => {
		setBtnMsg('loading');
		setSigningIn( true );
	}

	React.useEffect(() => {
		if( signingIn ){
			axios.post(`http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/sign-in`, { username: user.username, password: user.password })
			.then( res => {
				Cookies.set('token', res.data.accessToken);
				Cookies.set('rtoken', res.data.refreshToken);

				props.tools.setRole(() => res.data.role);
				props.tools.setAllow(() => true);
				props.tools.setView(() => res.data.path);

				setSigningIn( false );
			})
			.catch( err => {
				setErrMsg( err?.response?.data?.message );
				setSigningIn( false );
				setBtnMsg('sign me in');
			})
		}
	}, [signingIn, user]);

	React.useEffect(() => {
		if( unameField.current && passField.current ){
			const handleEnter = e => {
				if( e.key === 'Enter' ){
					handleSignin();
				}
			}

			unameField.current.addEventListener('keydown', handleEnter);
			passField.current.addEventListener('keydown', handleEnter);
		}
	}, [unameField, passField]);

	React.useEffect(() => {
		if( errMsg ){
			setTimeout(() => setErrMsg( null ), 2000);
		}
	}, [errMsg]);

	return(
		<div className="sign-in d-flex justify-content-center align-items-center">
			<div className="sign-in-box row d-flex flex-row-reverse align-items-center">
				{
					errMsg 
						? <div
								style={{
									position: 'absolute',
									top: '5%',
									left: '0%'
								}}
							>
								<Alert variant="filled" severity="error">
									{ errMsg }
								</Alert> 
							</div>
						: null
				}
				<div 
					style={{ height: 'fit-content', borderLeft: '1px solid #c8cac9' }}
					className="col-lg-6 d-flex justify-content-center align-items-center"
				>
					<img 
						id="cct-logo" 
						src={cctLogo} 
						alt="cct-logo"
					/>
				</div>
				
				<div style={{ height: '250px' }} className="col-lg-6 d-flex justify-content-center">
					<div 
						style={{ 
							height: '100%',
							width: 'fit-content'
						}} 
						className="sign-in-fields d-flex flex-column justify-content-around"
					>
						<h5 className="text-capitalize"><b>CCT</b> discipline record management</h5>
						<TextField 
							ref={unameField}
							sx={{ width: '6cm' }} 
							size="small" 
							label="Username" 
							onChange={setUsername} 
							id="sign-in-uname"
						/>
						<FormControl size="small" sx={{ width: '6cm' }} variant="outlined">
							<InputLabel htmlFor="sign-in-pass">Password</InputLabel>
							<OutlinedInput 
								ref={passField}
								label="Password"
								id="outlined-adornment-password" 
								type={ user.showPassword ? "text" : "password" }
								value={ user.password } 
								onChange={setPassword} 
								endAdornment={
		              <InputAdornment position="end">
		                <IconButton
		                  aria-label="toggle password visibility"
		                  onClick={handleClickShowPassword}
		                  onMouseDown={handleMouseDownPassword}
		                  edge="end"
		                >
		                  { user.showPassword ? <VisibilityOff sx={{ color: 'black' }}/> : <Visibility sx={{ color: 'black' }}/> }
		                </IconButton>
		              </InputAdornment>
		            }
							/>
						</FormControl>				
						<Button 
							onClick={handleSignin} 
							disabled={ btnMsg === 'loading' ? true : false } 
							sx={{ width: '6cm' }}
							variant="outlined"
							color="error"
						> 
							{ btnMsg } 
						</Button>		
					</div>
				</div>
			</div>
		</div>
	);
}


// 		<div 
// 			style={{ width: '100%', height: '100vh' }} 
// 			className="sign-in d-flex flex-column justify-content-center align-items-center"
// 		>
// 			{
// 				errMsg 
// 					? <Alert variant="outlined" severity="error">
// 						{ errMsg }
// 					</Alert> 
// 					: null
// 			}
// 			<div className="mb-3 d-flex justify-content-center">
// 				<h2 className="text-uppercase text-center" style={{ letterSpacing: '3px', color: 'rgba(0, 0, 0, 0.4)'}}>
// 					discpline records management
// 				</h2>
// 			</div>
// 			<br/>
// 			<div className="container-fluid d-flex justify-content-center align-items-center">
// 					<div 
// 						style={{
// 							backgroundColor: 'white',
// 							width: 'fit-content',
// 							height: '100%',
// 							border: '1px solid rgba(0, 0, 0, 0.3)',
// 							borderRadius: '10px'
// 						}} 
// 						className="p-3 d-flex flex-column justify-content-around align-items-center"
// 					>
// 						<div className="mb-3 d-flex justify-content-center">
// 							<p style={{ letterSpacing: '3px', color: 'rgba(0, 0, 0, 0.7)', fontSize: '14px'}}>Sign in to start your session</p>
// 						</div>
// 						<TextField ref={unameField} sx={{width: '6cm' }} onChange={setUsername} id="sign-in-uname" label="username" variant="outlined" />
// 						<Divider/>
// 						<FormControl sx={{ m: 3, width: '6cm' }} variant="outlined">
// 							<InputLabel htmlFor="sign-in-pass">Password</InputLabel>
// 							<OutlinedInput 
// 								ref={passField}
// 								id="outlined-adornment-password" 
// 								type={ user.showPassword ? "text" : "password" }
// 								value={ user.password } 
// 								onChange={setPassword} 
// 								endAdornment={
// 		              <InputAdornment position="end">
// 		                <IconButton
// 		                  aria-label="toggle password visibility"
// 		                  onClick={handleClickShowPassword}
// 		                  onMouseDown={handleMouseDownPassword}
// 		                  edge="end"
// 		                >
// 		                  { user.showPassword ? <VisibilityOff sx={{ color: 'black' }}/> : <Visibility sx={{ color: 'black' }}/> }
// 		                </IconButton>
// 		              </InputAdornment>
// 		            }
// 							/>
// 						</FormControl>
// 						<div className="d-flex flex-row justify-content-between align-items-center"> 
// 							<Button 
// 								onClick={handleSignin} 
// 								disabled={ btnMsg === 'loading' ? true : false } 
// 								sx={{borderColor: 'black', color: 'white', backgroundColor: '#dd4b39'}} 
// 								variant="filled"
// 								autoFocus
// 							> 
// 								{ btnMsg } 
// 							</Button>
// 						</div>
// 					</div>			
// 			</div>
// 		</div>

const PageNotFound = () => (
	<div className="d-flex justify-content-center align-items-center">
		<h1> PAGE NOT FOUND </h1>
	</div>
);

const Loading = () => {
	return (
		<div style={{ width: '100%' }}>
			<LinearProgress color="success"/>
		</div>
	);
}

function Path( pathname ){
  if( !pathname ) 
    console.warn('[Line 45 - Admin]: No given pathname');

  this.pathname = pathname;

  // this.home = () => {
  //   this.pathname = VIEWS[ 4 ];

  //   return this.pathname;
  // }

  this.exit = () => {
    this.pathname = VIEWS[ 0 ];

    return this.pathname;
  }

  this.kick = () => {
    this.pathname = VIEWS[ 0 ];

    return this.pathname;
  }
  
  this.exist = () => {
    return VIEWS.includes( this.pathname );
  };

  this.isRoot = () => {
    return this.pathname === ROOT;  
  }

  this.notFound = () => <PageNotFound />;

  // this.isSignUpPath = () => {
  //   return ( VIEWS.indexOf( this.pathname ) === 1
  //     ? true
  //     : false
  //   );
  // };

  this.isSignInPath = () => {
    return ( VIEWS.indexOf( this.pathname ) === 0
      ? true
      : false
    );
  };
} 

String.prototype.searchContain = function( otherString ) {	
	return this.toLowerCase()
		.replaceAll(' ', '')
		.search( otherString.toLowerCase().replaceAll(' ', '') ) === 0;
}

// <Route exact path="/admin">
// 		      <Admin/>
//     		</Route>

//     		<Route exact path="/student">
// 		      <Student/>
//     		</Route>

//     		<Route exact path="/system-admin">
// 		      <SystemAdmin/>
//     		</Route>

//     		<Route exact path="/administrative-staff">
// 		      <AdministrativeStaff/>
//     		</Route>

export default Authentication;