require('dotenv').config();

var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var path = require('path');
var fs = require('fs');

var Student = require('../models/student');
var User = require('../models/user');
var Sanction = require('../models/Sanction');
var Statistic = require('../models/Statistical');
var Report = require('../models/report');
var Archived = require('../models/archived');
var Token = require('../models/token');
var Trash = require('../models/trash');


var yearTrackerPath = path.join( __dirname, '../data/year-tracker.json');

const requestAccessToken = ( user ) => {
  return jwt.sign( user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' } );
};

const authentication = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[ 1 ];

  if( !token ) return res.sendStatus( 401 );

  jwt.verify( token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if( err ) return res.sendStatus( 401 );

    req.user = user;
    next();
  });
}

// ================ Authentication routes ==================

/* GET home page. */
router.get('/verify-me', authentication, async (req, res, next) => {
  // If a request came here then it is authorized
 	console.log( req.user );
 	
  return res.json({ username: req.user.name, role: req.user.role, message: `Welcome ${ req.user.username }`});
});


router.post('/sign-in', async (req, res, next) => {
  const { username, password } = req.body;

  Student.findOne({ studentID: username }, (err, doc) => {
    if( err ) return res.sendStatus( 500 );

    if( doc ){
      if( doc.archived.isArchived ){
        return res.status( 403 ).json({ message: 'This account is deactivated.' });
      }
      else{
        const user = { name: username, role: 'student' };
        const accessToken = requestAccessToken( user );
        const refreshToken = jwt.sign( user, process.env.REFRESH_TOKEN_SECRET );

        Token.create({ code: refreshToken }, err => {
          if( err ) return res.sendStatus( 500 );

          return res.json({
            message: `Welcome ${ username }!`,
            accessToken,
            refreshToken,
            role: doc.role,
            path: '/student' 
          });
        });
      }
    }
    else{
      User.findOne({ username: username, password: password }, (err, doc) => {
        if( err ) return res.sendStatus( 500 );

        if( doc ){
          if( doc.status === 'activated' ){

            const user = { name: username, role: doc.role };
            const accessToken = requestAccessToken( user );
            const refreshToken = jwt.sign( user, process.env.REFRESH_TOKEN_SECRET );

            Token.create({ code: refreshToken }, err => {
              if( err ) return res.sendStatus( 500 );

              let path = '';

              switch( doc.role ){
                case 'admin':
                  path = '/admin';
                  break;

                case 'sysadmin':
                  path = '/system-admin';
                  break;

                case 'adminstaff':
                  path = '/administrative-staff';
                  break;

                default:
                  path = '/student';              
                  break;
              }

              return res.json({
                message: `Welcome ${ username }!`,
                accessToken,
                refreshToken,
                role: doc.role,
                path 
              });
            });
          }
          else{
            return res.status( 403 ).json({ message: 'This account is deactivated.'});
          }
        }
        else{
          return res.status( 403 ).json({
            message: 'Incorrect password or username'
          });
        }
      });
    }
  });
});


router.post('/sign-up', async (req, res, next) => {
  const { username, password, masterPass } = req.body;

  User.findOne({ username: username }, (err, doc) => {
    if( err ) return res.sendStatus( 500 );

    if( doc ) return res.status( 403 ).json({ message: 'Username is already used' });

    const user = { name: username };
    const accessToken = requestAccessToken( user );
    const refreshToken = jwt.sign( user, process.env.REFRESH_TOKEN_SECRET );


    User.find({}, (err, doc) => {
      if( err ) return res.sendStatus( 500 );

      let role = 'normal';

      if( !doc.length ) role = 'admin';

      if( role === 'normal' ){
        User.find({ password: masterPass }, (err, doc) => {
          if( err ) return res.sendStatus( 500 );

          if( doc.length ){
            // create token and then the account
            Token.create({ code: refreshToken }, err => {
              if( err ) return res.sendStatus( 500 );

              User.create({ role: role, username: username, password: password }, err => {
                if( err ) return res.sendStatus( 500 );

                return res.json({
                  message: `Welcome ${ username }!`,
                  accessToken,
                  refreshToken
                });
              })
            });
          }
          else{
            return res.status( 403 ).json({
              message: 'Master password is Incorrect'
            })
          }
        });
      }
      else{
        // Create as an admin
        Token.create({ code: refreshToken }, err => {
          if( err ) return res.sendStatus( 500 );

          User.create({ role: role, username: username, password: password }, err => {
            if( err ) return res.sendStatus( 500 );

            return res.json({
              message: `Welcome ${ username }!`,
              accessToken,
              refreshToken
            });
          })
        });
      }
    });
  });
});


router.delete('/sign-out', async ( req, res ) => {
  Token.deleteOne({ code: req.body.token }, (err) => {
    if( err ) return res.sendStatus( 503 );

    return res.sendStatus( 200 );
  });
});


router.post('/auth/refresh-token', async ( req, res ) => {
  const { rtoken } = req.body;

  if( !rtoken ) return res.sendStatus( 403 );

  Token.find({ code: rtoken }, (err, token) => {
    if( err ) return res.sendStatus( 503 );

    if( !token && !token.length ) return res.sendStatus( 403 );

    jwt.verify( rtoken, process.env.REFRESH_TOKEN_SECRET, ( err, user ) => {
      if( err ) return res.sendStatus( 403 );

      const accessToken = requestAccessToken({ name: user.name });

      return res.status( 200 ).json({ 
        message: 'token has been received successfully ', 
        accessToken: accessToken
      });
    });
  });
});


// ===========================================================
router.get('/violation-list', async ( req, res ) => {
	Sanction.find({}, (err, list) => {
		if( err ) return res.sendStatus( 503 );

		return res.json( list );
	});
});

router.post('/save-violation', async ( req, res ) => {
  Sanction.findOne({ violationName: req.body.violationName }, (err, doc) => {
    if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

    if( doc ){
      return res.status( 403 ).json({ message: 'Violation name already exists!'});
    }
    else{
    	Sanction.create({ ...req.body }, err => {
    		if( err ) return res.sendStatus( 503 );

    		return res.sendStatus( 200 );
    	});
    }
  });
});

router.delete('/delete-violation/:id', async ( req, res ) => {
	Sanction.deleteOne({ _id: req.params.id }, err => {
		if( err ) return res.sendStatus( 503 );

		return res.sendStatus( 200 );
	});
});

router.put('/edit-violation/:id', async ( req, res ) => {
	const {
		violationName,
		firstOffense,
		secondOffense,
		thirdOffense
	} = req.body.item;

  Sanction.findOne({ violationName: violationName }, (err, doc) => {
    if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

    if( doc && doc._id.toString() !== req.params.id ){
      return res.status( 403 ).json({ message: 'Violation name already exists!'});
    }
    else{
      Sanction.updateOne({ _id: req.params.id }, { violationName, firstOffense, secondOffense, thirdOffense }, err => {
    		if( err ) return res.sendStatus( 503 );

    		return res.sendStatus( 200 );
    	});
    }
  });
});
// router.post('/signin', async( req, res ) => {
// 	const { username, password } = req.body;res

// 	User.findOne({ username: username, password: password }, (err, doc) => {
// 		if( err ) return res.sendStatus( 503 );

// 		console.log( doc );

// 		if( doc ) return res.status( 200 ).json({ message: 'Successful' });

// 		return res.status( 403 ).json({ message: 'Username or password is wrong'});
// 	});
// });


// ================= GLOBAL ACCESS ==================
router.get('/trash/role/:role', async (req, res) => {
  let data = null;

  switch( req.params.role ){
    case 'admin':
      data = await Trash.find().where('role').in(['sysadmin', 'adminstaff']);      

      return res.json( data );

    case 'sysadmin':
      data = await Trash.find().where('role').in(['admin']);      

      return res.json( data );      

    default:
      data = await Trash.find().where('role').in(['sysadmin', 'adminstaff', 'admin']);      

      return res.json( data );
  } 
});

router.put('/restore-trash/id/:id', async (req, res) => {
  Trash.findOne({ _id: req.params.id }, (err, doc) => {
    if( err ) return res.status( 503 ).json({ message: 'Please try again!' });
  
    if( doc ){
      const {
        firstname,
        middlename,
        lastname,
        username,
        password,
        email,
        role
      } = doc;

      User.create({ firstname, middlename, lastname, username, password, email, role, status: 'activated' }, err => {
        if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

        Trash.deleteOne({ _id: req.params.id }, (err, doc) => {
          if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

          return res.sendStatus( 200 );
        });
      });
    }    
    else{
      return res.end();
    }
  })
});

router.put('/delete-trash-permanently/id/:id', async (req, res) => {
  Trash.deleteOne({ _id: req.params.id }, (err, doc) => {
    if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

    return res.sendStatus( 200 );
  });
});

router.get('/statistical-data', async( req, res ) => {
  fs.readFile( yearTrackerPath, async (err, data) => {
    try{
        years = JSON.parse( data );

        let violatorsNumPerYear = {
          firstSemester : [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ],
          secondSemester : [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ]
        };


        let firstSem = await Report.find()
          .$where(`[${years.yearTracker}].includes(Number( this.dateOfReport.split('-')[0] ))`)
          .and([{ semester: '1st semester' }]);

        let secondSem = await Report.find()
          .$where(`[${years.yearTracker}].includes(Number( this.dateOfReport.split('-')[0] ))`)
          .and([{ semester: '2nd semester' }]);

        let memoizedID = [];

        firstSem.forEach( item => {
          if( memoizedID.includes( item.studentID ) ) return;
          memoizedID.push( item.studentID );

          let index = years.yearTracker.indexOf(Number( item.dateOfReport.split('-')[0] ));

          if( index >= 0 ) violatorsNumPerYear.firstSemester[ index ] += 1; 
        });

        memoizedID = [];

        secondSem.forEach( item => {
          if( memoizedID.includes( item.studentID ) ) return;
          memoizedID.push( item.studentID );

          let index = years.yearTracker.indexOf(Number( item.dateOfReport.split('-')[0] ));

          if( index >= 0 ) violatorsNumPerYear.secondSemester[ index ] += 1; 
        });

        return res.json({
          years: years.yearTracker,
          firstSem: violatorsNumPerYear.firstSemester,
          secondSem: violatorsNumPerYear.secondSemester
        });
    }
    catch( err ){
      return res.sendStatus( 503 );
    }
  });
});

router.get('/student-report/:id', async( req, res ) => {
  Student.findOne({ studentID: req.params.id }, async (err, student) => {
    if( err ) return res.sendStatus( 503 );

    if( student ){
      try{
        const report = await Report.find({ studentID: req.params.id });

        return res.json({ student, report }); 
      }
      catch( err ){
        return res.sendStatus( 503 );
      }
      Report.find({ studentID: req.params.id }, (err, report) => {
        if( err ) return res.sendStatus( 503 );

        if( report ){
          return res.json({student, report: report});
        }
        else{
          return res.sendStatus( 404 );
        }
      });
    }
    else{
      return res.sendStatus( 404 );
    }
  });
});

router.get('/student-data', async( req, res ) => {
	try{
    const result = await Student.find().$where(function() {
      return this.archived.isArchived === false;
    });

		return res.json( result );
  }
  catch( err ){
    return res.sendStatus( 503 );
  }
});

router.put('/change-user-status', async( req, res ) => {
  const { username, status } = req.body;

  User.findOneAndUpdate({ username: username }, { status: status }, err => {
    if( err ) return res.sendStatus( 503 );

    return res.sendStatus( 200 );
  });
});

router.delete('/delete-user/id/:id', async( req, res ) => {
  User.findOne({ _id: req.params.id }, (err, doc) => {
    if( err ) return res.status( 503 ).json({ message: 'Please try again!' });
  
    if( doc ){
      const {
        firstname,
        middlename,
        lastname,
        username,
        password,
        email,
        role
      } = doc;

      Trash.create({ firstname, middlename, lastname, username, password, email, role }, err => {
        if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

        User.deleteOne({ _id: req.params.id }, (err, doc) => {
          if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

          return res.sendStatus( 200 );
        });
      });
    }    
    else{
      return res.end();
    }
  });
});

// ================= ADMINISTRATOR ===================

router.get('/accounts/admin', async( req, res ) => {
  try{
    const result = await User.find().$where(function() {
      return this.role === 'sysadmin' || this.role === 'adminstaff';
    });

    return res.json( result );
  }
  catch (err) {
    return res.sendStatus( 503 );
  }
});

router.post('/create-user/admin', async( req, res ) => {
  Student.findOne({ studentID: req.body.username }, (err, doc) => {
    if( err ) return res.sendStatus( 503 );

    if( doc ){
      return res.json({ message: 'You must not try to use student ID as your username' });
    }
    else{
      User.findOne({ username: req.body.username }, (err, doc) => {
        if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

        if( doc && doc._id.toString() !== req.body.id ){
          return res.status( 403 ).json({ message: 'Username already exists!' });
        }
        else{
          User.create({ ...req.body }, err => {
            if( err ) return res.sendStatus( 503 );

            return res.sendStatus( 200 );
          });
        }        
      });
    }
  });
});

router.post('/edit-user/admin', async( req, res ) => {
  Student.findOne({ studentID: req.body.username }, (err, doc) => {
    if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

    if( doc ){
      return res.json({ message: 'You must not try to use student ID as your username' });
    }
    else{
      User.findOne({ username: req.body.username }, (err, doc) => {
        if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

        if( doc && doc._id.toString() !== req.body.id ){
          return res.status( 403 ).json({ message: 'Username already exists!' });
        }
        else{
          User.findOneAndUpdate({ _id: req.body.id }, { ...req.body }, err => {
            if( err ) return res.sendStatus( 503 );

            return res.sendStatus( 200 );
          });
        }
      });
    }
  });
});


// ============== SYSTEM ADMINISTRATOR ================

router.get('/accounts/system-admin', async( req, res ) => {
    User.find({ role: 'admin' }, (err, list) => {
      if( err ) return res.sendStatus( 503 );

      return res.json( list );
    });
});


// =============== ADMINISTRATOR STAFF =================

router.post('/save-report', async( req, res ) => {
  Report.create({ ...req.body }, err => {
    if( err ) return res.sendStatus( 503 );

    return res.json({ message: 'Successfully saved report!'});
  });
});

router.post('/save-report-image', async( req, res ) => {
  if( !req.files ) return res.status( 404 );
  
  const image = req.files.reportImage;
  const destination = path.join(__dirname, '../client/public/images/reports', image.name);

  image.mv( destination, err => {
    if( err ) return res.sendStatus( 503 );

    return res.sendStatus( 200 );
  });
});

router.put('/archive-student', async( req, res ) => {
  Student.findOne({ studentID: req.body.studentID }, async (err, doc) => {
    if( err ) return res.sendStatus( 503 );

    if( doc ){
      const isArchived = doc.archived.isArchived;
      doc.archived = {
        isArchived: !isArchived,
        year: new Date().getFullYear()
      };

      try{
        await doc.save();
        return res.sendStatus( 200 );
      }
      catch( err ) {
        throw err
        return res.sendStatus( 503 );
      }
    }
    else{
      return res.sendStatus( 404 );
    }
  })
});


router.put('/unarchive-student', async( req, res ) => {
  Student.findOne({ studentID: req.body.studentID }, async (err, doc) => {
    if( err ) return res.sendStatus( 503 );

    if( doc ){
      const isArchived = doc.archived.isArchived;
      doc.archived = {
        isArchived: !isArchived,
        year: new Date().getFullYear()
      };

      try{
        await doc.save();
        return res.sendStatus( 200 );
      }
      catch( err ) {
        throw err
        return res.sendStatus( 503 );
      }
    }
    else{
      return res.sendStatus( 404 );
    }
  })
});


router.get('/archived-students', async( req, res ) => {
  try{
    const result = await Student.find().$where(function() {
      return this.archived.isArchived === true;
    });

    return res.json( result );
  }
  catch (err) {
    console.log( err );
    return res.sendStatus( 503 );
  }
});



router.post('/create-student', async( req, res ) => {
  Student.findOne({ studentID: req.body.studentID }, (err, doc) => {
    if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

    if( doc ){
      return res.status( 403 ).json({ message: 'Student ID already exists!'});
    }
    else{
      Student.create({ ...req.body }, err => {
        if( err ) throw err;

        return res.sendStatus( 200 );
      });
    }
  });
});


router.put('/edit-student/:id', async( req, res ) => {
  Student.findOne({ studentID: req.body.studentID }, (err, doc) => {
    if( err ) return res.status( 503 ).json({ message: 'Please try again!' });

    if( doc && doc._id.toString() !== req.params.id ){
      return res.status( 403 ).json({ message: 'Student ID already exists!'});
    }
    else{
      Student.findOneAndUpdate({ _id: req.params.id }, { ...req.body }, err => {
        if( err ) return res.sendStatus( 503 );

        return res.sendStatus( 200 );
      });
    }
  });
});


router.delete('/delete-student/:id', async( req, res ) => {
  Student.deleteOne({ _id: req.params.id }, eerr => {
    if( err ) return res.sendStatus( 503 );

    return res.sendStatus( 200 );
  });
});


const incrementYearTracker = tracker => {
  return tracker.map( year => year += 1 );
}

module.exports = router;
