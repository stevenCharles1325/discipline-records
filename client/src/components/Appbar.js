import React from 'react';
import uniqid from 'uniqid';
import axios from 'axios';
import Cookies from 'js-cookie';

import { styled, alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Badge from '@mui/material/Badge';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import MoreIcon from '@mui/icons-material/MoreVert';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useSnackbar } from 'notistack';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';

import Chip from '@mui/material/Chip';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import cctLogo from '../images/cct-logo.ico';

const CustomDivider = styled( Divider )(({ theme }) => ({
 	height: '3px !important',
 	width: '70%',
 	backgroundColor: '#B82020',
 	alignSelf: 'center',
 	opacity: '1'
}));

// const Search = styled('div')(({ theme }) => ({
//   position: 'relative',
//   borderRadius: theme.shape.borderRadius,
//   backgroundColor: alpha(theme.palette.common.white, 0.15),
//   '&:hover': {
//     backgroundColor: alpha(theme.palette.common.white, 0.25),
//   },
//   marginRight: theme.spacing(2),
//   marginLeft: 0,
//   width: '100%',
//   [theme.breakpoints.up('sm')]: {
//     marginLeft: theme.spacing(3),
//     width: 'auto',
//   },
// }));

// const SearchIconWrapper = styled('div')(({ theme }) => ({
//   padding: theme.spacing(0, 2),
//   height: '100%',
//   position: 'absolute',
//   pointerEvents: 'none',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
// }));

// const StyledInputBase = styled(InputBase)(({ theme }) => ({
//   color: 'inherit',
//   '& .MuiInputBase-input': {
//     padding: theme.spacing(1, 1, 1, 0),
//     // vertical padding + font size from searchIcon
//     paddingLeft: `calc(1em + ${theme.spacing(4)})`,
//     transition: theme.transitions.create('width'),
//     width: '100%',
//     [theme.breakpoints.up('md')]: {
//       width: '20ch',
//     },
//   },
// }));

const Root = styled('div')(({ theme }) => ({
  width: '100%',
  ...theme.typography.body2,
  '& > :not(style) + :not(style)': {
    marginTop: theme.spacing(2),
  },
}));

const CustomListItem = styled( ListItem )`
	background-color: rgba(0, 0, 0, 0.1);
	border-radius: 25px 0 0 25px;
	margin: 10px 0 10px 5px;
	width: 98%;
	position: relative;

	transition: .5s ease-in-out;
`;

const Appbar = props => {
	const roles = {
		adminstaff: 'Administrative-Staff',
		sysadmin: 'System-Administrator',
		admin: 'Administrator',
		student: 'Student'
	}

	const [activeDrawer, setActiveDrawer] = React.useState( props?.listItems?.[ 0 ]?.title );
	const [drawer, setDrawer] = React.useState( false );
	const [anchorEl, setAnchorEl] = React.useState(null);
	const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = React.useState(null);
	const [allowSearch, setSearchAllow] = React.useState( props?.openSearchOn?.includes?.( props?.listItems?.[0]?.title ) ?? false );

	const [isMenuOpen, setIsMenuOpen] = React.useState( true );

	const { enqueueSnackbar } = useSnackbar();

	const toggleDrawer = open => event => {
	    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
	      return;
	    }

	    setDrawer( false );
	};

	// const isMenuOpen = Boolean(anchorEl);
	// const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);

	const handleProfileMenuOpen = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleMobileMenuClose = () => {
		setMobileMoreAnchorEl(null);
	};

	const handleMenuClose = () => {
		setAnchorEl(null);
		handleMobileMenuClose();
	};

	const handleMobileMenuOpen = (event) => {
		setMobileMoreAnchorEl(event.currentTarget);
	};

	const handleSignout = async () => {
		axios.delete(`http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/sign-out`)
		.then(() => {
			Cookies.remove('token');
			Cookies.remove('rtoken');

			props.tools.setView('/sign-in');
		})
		.catch( err => {
			setTimeout(() => handleSignout(), 5000);
		});
	}

	const mobileMenuId = 'primary-search-account-menu-mobile';
	// const renderMobileMenu = (
	// 	<Menu
	// 	  anchorEl={mobileMoreAnchorEl}
	// 	  anchorOrigin={{
	// 	    vertical: 'top',
	// 	    horizontal: 'right',
	// 	  }}
	// 	  id={mobileMenuId}
	// 	  keepMounted
	// 	  transformOrigin={{
	// 	    vertical: 'top',
	// 	    horizontal: 'right',
	// 	  }}
	// 	  open={isMenuOpen}
	// 	  onClose={handleProfileMenuOpen}
	// 	>
	// 		<MenuItem onClick={handleProfileMenuOpen}>
	// 			<Stack>
	// 				<IconButton
	// 					size="small"
	// 					aria-label="log out account of current user"
	// 					aria-controls="primary-search-account-menu"
	// 					aria-haspopup="true"
	// 					color="inherit"
	// 					onClick={handleSignout}
	// 				>
	// 					<MeetingRoomIcon/>
	// 				</IconButton>
	// 			</Stack>
	// 		</MenuItem>
	// 	</Menu>
	// );

	const menuId = 'primary-search-account-menu';
	const renderMenu = (
	    <Menu
	      anchorEl={anchorEl}
	      anchorOrigin={{
	        vertical: 'top',
	        horizontal: 'right',
	      }}
	      id={menuId}
	      keepMounted
	      transformOrigin={{
	        vertical: 'top',
	        horizontal: 'right',
	      }}
	      open={isMenuOpen}
	      onClose={handleMenuClose}
	    >
	    	<Stack sx={{padding: '2px 10px 2px 10px'}}>
		     	<MenuItem onClick={handleSignout}>Sign-out</MenuItem>
	    	</Stack>
	    </Menu>
	);

	// Data to be received must be looked like this { title: <List_title>, onClick: <function> }
	const list = () => (
	    <Box
	      sx={{ width: 240, padding: '10px 20px 20px 10px' }}
	      role="presentation"
	      onClick={toggleDrawer(false)}
	      onKeyDown={toggleDrawer(false)}
	    >
				<List>
					{props?.listItems?.map?.((item, index) => (
						<ListItem 
							key={uniqid()} 
							button 
							onClick={() => {
								item.onClick();
								setSearchAllow( props?.openSearchOn?.includes?.( item?.title ) ?? false );
							}}
						>
							<ListItemIcon>
								<ArrowForwardIosIcon fontSize="small" />
							</ListItemIcon>
							<ListItemText primary={item.title} />
						</ListItem>
					))}
				</List>
	    </Box>
	);
	
	return(
		<div className="app-bar d-flex">
			<div style={{ display: isMenuOpen ? 'unset' : 'none' }} className="app-bar-left">
				<div className="app-bar-menu d-flex flex-column justify-content-center">
					<div className="app-bar-menu-button col-12 p-2 ">
						<IconButton onClick={() => setIsMenuOpen( !isMenuOpen )}>
							<MenuIcon fontSize="small"/>
						</IconButton>
					</div>
					<div style={{ width: '100%', height: 'fit-content' }} className="d-flex justify-content-center align-items-center">
						<img src={cctLogo}/>
					</div>
					<CustomDivider variant="middle"/>
					<br/>
					<div className="app-bar-menu-items">
						{
							props?.listItems?.map(({ title, onClick, icon }, index) => (
								<CustomListItem 
									key={uniqid()} 
									button 
									sx={{
										color: activeDrawer === title ? 'black' : 'rgba(0, 0, 0, 0.5)',
										backgroundColor: activeDrawer === title ? 'white' : 'rgba(0, 0, 0, 0.1)',
										boxShadow: activeDrawer === title ? '-5px 2px 5px rgba(0, 0, 0, 0.1)' : 'unset',
										"&:hover": {
											color: activeDrawer === title ? 'red' : 'white',
											backgroundColor: activeDrawer === title ? 'white' : 'rgba(0, 0, 0, 0.2)'
										},
										"&::after": activeDrawer === title 
												? {
													content: `""`,
													position: 'absolute',
													top: '-10%',
													right: '0',
													backgroundColor: 'transparent',
													width: '0px',
													height: '0px',
													border: '6px solid white',
													borderColor: 'transparent white transparent transparent',
												}
											: null,
										"&::before": activeDrawer === title 
												? {
													content: `""`,
													position: 'absolute',
													bottom: '-10%',
													right: '0',
													backgroundColor: 'transparent',
													width: '0px',
													height: '0px',
													border: '6px solid white',
													borderColor: 'transparent white transparent transparent',
												}
											: null,
									}}
									onClick={() => {
										onClick?.();
										setActiveDrawer( title );
										setSearchAllow( props?.openSearchOn?.includes?.( title ) ?? false );
									}}
								>
									<ListItemIcon>
										{ icon }
									</ListItemIcon>
									<ListItemText primary={title} />
								</CustomListItem>
							)) 
						}
          	{ props.tools.role === 'student' ? <StudentTreeView setSelectedYearAndSem={props.setSelectedYearAndSem} studentID={props.tools.name}/> : null }
          	{
          		props?.tools?.role === 'sysadmin'
          			? <div className="mt-5 d-flex justify-content-center align-items-center">
			          		<Button 
						          	onClick={() => {
						          		axios.get(`http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/back-up`)
						          		.then( res => {
						          			enqueueSnackbar( 'Downloading...', { variant: 'success' });

						          			const { student, user, sanction, statistic, report, archived, schoolYear, trash } = res.data;
						          			const objList = [ student, user, sanction, statistic, report, archived, schoolYear, trash ];
						          			const names = [ 'students', 'users', 'sanctions', 'statistics', 'reports', 'archives', 'schoolYears', 'trashes' ];

						          			objList.forEach((obj, index) => {
						          				var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify( obj ));

						          				const link = document.createElement('a');
						          				link.href = `data:${data}`;
						          				link.setAttribute('download', `${names[ index ]}.json`);

						          				document.body.appendChild( link );
															link.click();
						          				// $('<a href="data:' + data + '" download="data.json">download JSON</a>').appendTo('#container');
						          			});	
						          		})
						          		.catch( err => {
						          			console.log( err );
						          			enqueueSnackbar( 'Please try again later.', { variant: 'error' });
						          		});
						          	}}
						          	variant="outlined" 
						          	color="error"
						          >
						          	back up
						          </Button>
		          		</div>
          			: null
          	}
					</div>
				</div>
			</div>
			<div className="app-bar-right d-flex flex-column">
				<div style={{ display: isMenuOpen ? 'flex' : 'none' }} className="app-bar-title">
					<h3 className="m-0 px-2">discipline record management</h3>
				</div>
				<div style={{ borderRadius: isMenuOpen ? '15px' : '0' }} className="app-bar-content-box p-2">
					{/* Contents go here */}
					<div className="app-bar-menu-bar px-2 d-flex justify-content-between align-items-center">
						<IconButton onClick={() => setIsMenuOpen( !isMenuOpen )}>
							<MenuIcon fontSize="small"/>
						</IconButton>

						<div className="app-bar-menu-label flex-grow-1 px-3 d-flex justify-content-start" role="presentation" style={{ width: 'fit-content' }}>
							<Breadcrumbs aria-label="breadcrumb">
								<Typography sx={{ fontSize: '13px', fontFamily: 'Poppins-Black', color: 'rgba(0, 0, 0, 0.6)' }}>{ roles[ props?.tools?.role ] }</Typography>
								<Typography sx={{ fontSize: '13px', fontFamily: 'Poppins-Black', color: 'rgba(0, 0, 0, 0.4)' }}>{ activeDrawer }</Typography>
							</Breadcrumbs>
						</div>
						<div style={{ width: 'fit-content' }} className="d-flex justify-content-around align-items-center">
							{/*<div className="app-bar-search-bar px-2 d-flex align-items-center">
								<SearchIcon sx={{ color: 'rgba(0, 0, 0, 0.2)' }} fontSize="small"/>
								<div className="flex-grow-1">
									<input onChange={props?.getSearchContent} className="app-bar-search-bar-input" placeholder="Search..."/>
									<div className="app-bar-search-bar-input-2"/>
								</div>
							</div>*/}
							<IconButton onClick={handleSignout}>
								<PowerSettingsNewIcon style={{ color: 'red' }} fontSize="small"/>
							</IconButton>
						</div>
					</div>
					<div className="flex-grow-1 overflow-auto p-3">
						{ props.children }
					</div>
				</div>
			</div>
		</div>
	)
}

// <>
// 			<AppBar id="main-app-bar" position="static" sx={{ backgroundColor: 'black !important', color: 'white !important' }}>
// 	        <Toolbar>
// 					<IconButton
// 						size="large"
// 						edge="start"
// 						color="inherit"
// 						aria-label="open drawer"
// 						sx={{ mr: 2 }}
// 						onClick={() => setDrawer( true )}
// 					>
// 						<MenuIcon />
// 					</IconButton>
// 					<div className="col-4 d-flex justify-content-start align-items-center">
// 						<b id="app-title" className="p-0 m-0">Discipline Records Management</b>
// 					</div>
// 					{
// 						allowSearch
// 							? (
// 									<Search>
// 										<SearchIconWrapper>
// 										  <SearchIcon />
// 										</SearchIconWrapper>
// 										<StyledInputBase
// 											onChange={props.getSearchContent}
// 											placeholder="Search…"
// 											inputProps={{ 'aria-label': 'search' }}
// 										/>
// 									</Search>
// 								)
// 							: null
// 					}
// 					<Box sx={{ flexGrow: 1 }} />
//           <Typography
// 						variant="h6"
// 						noWrap
// 						component="div"
// 						sx={{ display: { xs: 'none', sm: 'block' } }}
// 					>
// 						{ props.title ?? 'Menu' }
// 					</Typography>
// 					<Box sx={{ display: { xs: 'none', md: 'flex' } }}>
// 						<IconButton
// 							size="large"
// 							edge="end"
// 							aria-label="account of current user"
// 							aria-controls={menuId}
// 							aria-haspopup="true"
// 							onClick={handleProfileMenuOpen}
// 							color="inherit"
// 						>
// 							<AccountCircle />
// 						</IconButton>
// 					</Box>
// 					<Box sx={{ display: { xs: 'flex', md: 'none' } }}>
// 						<IconButton
// 							size="large"
// 							aria-label="show more"
// 							aria-controls={menuId}
// 							aria-haspopup="true"
// 							onClick={handleProfileMenuOpen}
// 							color="inherit"
// 						>
// 							<MoreIcon />
// 						</IconButton>
// 					</Box>
// 	        </Toolbar>
// 		    </AppBar>
// 		    {/*{renderMobileMenu}*/}
// 		    {renderMenu}
// 		    <Drawer
//           anchor="left"
//           open={drawer}
//           onClose={toggleDrawer(false)}
//         >
//         	<div className="continer-fluid p-2 d-flex justify-content-center align-items-center">
// 						<img id="cct-logo" src="images/cctLogo_new.ico" alt="cct logo"/>
//         	</div>
//         	<Divider/>
//           { list() }
//           {
//           	props.tools.role === 'sysadmin'
//           		? (
//           				<>
//           					<Divider/>
// 					          <br/>
// 					          <div className="d-flex justify-content-center align-items-center">
// 						          <Button 
// 						          	onClick={() => {
// 						          		axios.get(`http://${process.env.REACT_APP_HOST}:${process.env.REACT_APP_PORT}/back-up`)
// 						          		.then( res => {
// 						          			enqueueSnackbar( 'Downloading...', { variant: 'success' });

// 						          			const { student, user, sanction, statistic, report, archived, schoolYear } = res.data;
// 						          			const objList = [ student, user, sanction, statistic, report, archived, schoolYear ];
// 						          			const names = [ 'student', 'user', 'sanction', 'statistic', 'report', 'archived', 'schoolYear' ];

// 						          			objList.forEach((obj, index) => {
// 						          				var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify( obj ));

// 						          				const link = document.createElement('a');
// 						          				link.href = `data:${data}`;
// 						          				link.setAttribute('download', `${names[ index ]}.json`);

// 						          				document.body.appendChild( link );
// 															link.click();
// 						          				// $('<a href="data:' + data + '" download="data.json">download JSON</a>').appendTo('#container');
// 						          			});	
// 						          		})
// 						          		.catch( err => {
// 						          			console.log( err );
// 						          			enqueueSnackbar( 'Please try again later.', { variant: 'error' });
// 						          		});
// 						          	}}
// 						          	variant="filled" 
// 						          	sx={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', color: 'white'}}
// 						          >
// 						          	back up
// 						          </Button>
// 					          </div>
//           				</>
//           			)
//           		: null
//           }
//           { props.tools.role === 'student' ? <StudentTreeView setSelectedYearAndSem={props.setSelectedYearAndSem} studentID={props.tools.name}/> : null }
//         </Drawer>
//         { props.children }
// 		</>

const StudentTreeView = props => {
	const [schoolYear, setSchoolYear] = React.useState( [] );

	const [selected, setSelected] = React.useState( Number(Cookies.get('slctd')) ?? 2 );
	const [expanded, setExpanded] = React.useState( Cookies.get('xpndd')?.length ? JSON.parse( Cookies.get('xpndd') ) : ['1'] );
	const [label, setLabel] = React.useState( '' );

	React.useEffect(() => {
		if( props.studentID ){
			const schoolYears = [];

			/*
				Finding school year is based on the student ID. Our school ID's first two digits are indicating what year
				we enrolled. 

				For example: 1801201

				The "18" in "1801201" means that the year the student enrolled was on 2018, but we can not assume that the year will be 
				in the range of 2000, so we have to get the current year and get the first two digits of it.

				For example: 2022

				The "20" in "2022" means the current year is in the range of 2000, so when we get into ${process.env.REACT_APP_PORT} we can still get the exact year
				the student enrolled.
			*/
			const yearStarted = Number(new Date().getFullYear().toString().slice( 0, 2 ) + props.studentID.slice( 0, 2 ));
			let currentSchoolYear = yearStarted;

			for( let i = 0; i < 4; i++ ){
				schoolYears.push( `${currentSchoolYear}-${currentSchoolYear + 1}` );
				currentSchoolYear += 1;
			}

			setSchoolYear([ ...schoolYears ]);
		}
	}, [props]);

	const getSemester = sem => Number( sem ) % 2 === 0 ? '1st semester' : '2nd semester';

	React.useEffect(() => {
		if( schoolYear.length ){
			if( String( selected ) === '2' || String( selected ) === '3' ){
				Cookies.set('slctd', selected);
				setLabel( `${schoolYear[ 0 ]} - ${getSemester( selected )}` );
			}
			else if( String( selected ) === '6' || String( selected ) === '7' ){
				Cookies.set('slctd', selected);
				setLabel( `${schoolYear[ 1 ]} - ${getSemester( selected )}` );
			}
			else if( String( selected ) === '10' || String( selected ) === '11' ){
				Cookies.set('slctd', selected);
				setLabel( `${schoolYear[ 2 ]} - ${getSemester( selected )}` );
			}
			else if( String( selected ) === '14' || String( selected ) === '15' ){
				Cookies.set('slctd', selected);
				setLabel( `${schoolYear[ 3 ]} - ${getSemester( selected )}` );
			}
		}
	}, [selected, schoolYear]);

	React.useEffect(() => {
		Cookies.set('xpndd', JSON.stringify([expanded?.[ 0 ]]));
	}, [expanded]);

	React.useEffect(() => {
		Cookies.set('crrntslctd', label);
		props?.setSelectedYearAndSem?.( label );
	}, [label]);

	return(
			<>
				<Root>
					<Divider textAlign="left" sx={{ width: '100%', margin: '50px 0px 25px 0px'}}>
						<Chip 
							icon={<ListAltIcon fontSize="small"/>} 
							sx={{ borderColor: 'black', padding: '0px 5px 0px 5px' }} 
							variant="outlined" label={label}
						/>
					</Divider>
				</Root>
				<TreeView
	        aria-label="controlled"
	        defaultCollapseIcon={<ExpandMoreIcon fontSize="large"/>}
	        defaultExpandIcon={<ChevronRightIcon fontSize="large"/>}
	        selected={selected}
	        expanded={expanded}
	        onNodeToggle={(_, nodeIds) => setExpanded( nodeIds )}
	        onNodeSelect={(_, nodeIds) => setSelected( nodeIds )}
	        // expanded={expanded}
	      >
	        <TreeItem nodeId="1" label={schoolYear[ 0 ]}>
	          <TreeItem nodeId="2" label="1st semester" />
	          <TreeItem nodeId="3" label="2nd semester" />
	        </TreeItem>
	        
	        <TreeItem nodeId="5" label={schoolYear[ 1 ]}>
	          <TreeItem nodeId="6" label="1st semester" />
	          <TreeItem nodeId="7" label="2nd semester" />
	        </TreeItem>

	        <TreeItem nodeId="9" label={schoolYear[ 2 ]}>
	          <TreeItem nodeId="10" label="1st semester" />
	          <TreeItem nodeId="11" label="2nd semester" />
	        </TreeItem>

	        <TreeItem nodeId="13" label={schoolYear[ 3 ]}>
	          <TreeItem nodeId="14" label="1st semester" />
	          <TreeItem nodeId="15" label="2nd semester" />
	        </TreeItem>
	      </TreeView>
      </>
		)
}

export default Appbar;