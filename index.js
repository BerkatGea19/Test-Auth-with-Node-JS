const path = require('path');
const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const db = require('./connection')
const response=require('./response')
const exphbs = require('express-handlebars')
const cookieParser = require('cookie-parser')

// untuk URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// untuk parse cookies dari HTTP Request
app.use(cookieParser());

// Configure express-handlebars
app.engine('hbs', exphbs.engine({
  extname: '.hbs'
}));

app.set('view engine', 'hbs');
app.set('views', './views');

app.use(bodyParser.json());

app.get('/', function (req, res) {
  res.render('home');
});

app.get('/register', (req, res) => {
  res.render('register');
});
const crypto = require('crypto');

const getHashedPassword = (password) => {
  const sha256 = crypto.createHash('sha256');
  const hash = sha256.update(password).digest('base64');
  return hash;
}
const users = [
  {
    firstName: 'Berkat',
    lastName: 'Gea',
    email: 'test1@email.com',
    // This is the SHA256 hash for value of `password`
    password: 'XohImNooBHFR0OVvjcYpJ3NgPQ1qq73WKhHvch0VQtg='
  }
];

app.post('/register', (req, res) => {
  const { email, firstName, lastName, password, confirmPassword } = req.body;
  if (password === confirmPassword) {
    if (users.find(user => user.email === email)) {

      res.render('register', {
        message: 'User already registered.',
        messageClass: 'alert-danger'
      });

      return;
    }

    const hashedPassword = getHashedPassword(password);
    users.push({
      firstName,
      lastName,
      email,
      password: hashedPassword
    });

    res.render('login', {
      message: 'Registration Complete. Please login to continue.',
      messageClass: 'alert-success'
    });
  } else {
    res.render('register', {
      message: 'Password does not match.',
      messageClass: 'alert-danger'
    });
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
}
const authTokens = {};

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = getHashedPassword(password);

  const user = users.find(u => {
    return u.email === email && hashedPassword === u.password
  });

  if (user) {
    const authToken = generateAuthToken();

    authTokens[authToken] = user;

    res.cookie('AuthToken', authToken);

    res.redirect('/protected');
  } else {
    res.render('login', {
      message: 'Invalid username or password',
      messageClass: 'alert-danger'
    });
  }
});
app.use((req, res, next) => {
  const authToken = req.cookies['AuthToken'];

  req.user = authTokens[authToken];

  next();
});

app.get('/protected', (req, res) => {
  if (req.user) {
    res.render('protected');
  } else {
    res.render('login', {
      message: 'Please login to continue',
      messageClass: 'alert-danger'
    });
  }
});
app.get('/logout', function(req, res) {
  cookie = req.cookies;
  for(var prop in cookie){
    if (!cookie.hasOwnProperty(prop)) {
      continue;
    }
    res.cookie(prop, '', {expires: new Date(0)});
    console.log("User Logout")
  }
  res.redirect('/login');
});

// app.get('/', (req, res) => {
//   response(200, "API v1 ready to go", "SUCCESS", res)
// })

app.get('/mahasiswa', (req, res) => {
  const sql = "SELECT * FROM mahasiswa"
  db.query(sql, (err, fields) => {
    response(200,fields, "mahasiswa get list", res)
  })
})

app.get('/mahasiswa/:nim', (req, res) => {
  const nim = req.params.nim
  const sql = `SELECT * FROM mahasiswa WHERE nim = ${nim}`
  db.query(sql, (err, fields) => {
    if (err) throw err
    response(200, fields,"get detail mahasiswa", res)
  })
  
})

app.post("/mahasiswa", (req, res) => {
  const { nim, namaLengkap, kelas, alamat } = req.body

  const sql = `INSERT INTO mahasiswa (nim, nama, kelas, alamat) VALUES
  (${nim}, '${namaLengkap}', '${kelas}', '${alamat}')`

  db.query(sql, (err, fields) => {
    if (err) response(500, "invalid", "error", res)
    if (fields?.affectedRows){
      const data = {
        isSuccess: fields.affectedRows,
        id: fields.insertId,
      }
      response(200, data, "data added Successfuly", res)
    }
  })
})

app.put("/mahasiswa", (req, res) => {
  const {nim, namaLengkap, kelas, alamat } = req.body
  const sql = `UPDATE mahasiswa SET nama = '${namaLengkap}', kelas = '${kelas}',
  alamat = '${alamat}' WHERE nim = ${nim}`

  db.query(sql,(err, fields) => {
    if (err) response(500, "Invalid", "error", res)
    if (fields?.affectedRows){
      const data = {
        isSuccess: fields.affectedRows,
        message: fields.message,
      }
      response(200, data, "Update data succsesfuly", res)
    }else {
      response(404, "User not found","error", res)
    }
  })
  
})

app.delete("/mahasiswa", (req, res) => {
  const {nim} = req.body
  const sql = `DELETE FROM mahasiswa WHERE nim = ${nim}`
  db.query(sql,(err, fields) => {
    if (err) response(500, "Invalid", "Error", res)
    if (fields?.affectedRows) {
      const data = {
        isDeleted: fields.affectedRows,
      }
      response(200, data, "Deleted Data Succsessfuly", res)
    }else {
      response(404, "User not found","error", res)
    }
  })

})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  console.log(app.get('views'));
})