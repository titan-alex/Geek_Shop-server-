const express = require('express')
const mysql = require('mysql');
const path = require('path')
const session = require('express-session');
// https://www.npmjs.com/package/bcrypt
const bcrypt = require("bcrypt");
const multer = require("multer");
const { Session } = require('inspector');
const fs = require("fs");
const app = express()

// Путь к директории для загрузок
const upload = multer({ dest: "./public/img/category/catalog/" });

require('dotenv').config();

const connection = mysql.createConnection(
{
 host: process.env.DB_HOST,
 database: process.env.DB_NAME,
 user: process.env.DB_USER,
 password: process.env.DB_PASS,
});

connection.connect(function (err) { if (err) throw err; });

// Путь к директории файлов ресурсов (css, js, images)
app.use(express.static('public'))

// Настройка шаблонизатора
app.set('view engine', 'ejs')

// Путь к директории файлов отображения контента
app.set('views', path.join(__dirname, 'views'))


// Обработка POST-запросов из форм
app.use(express.urlencoded({ extended: true }))

// Инициализация сессии
app.use(session({ secret: "Secret", resave: false, saveUninitialized: true }));

// Middleware
function isAuth(req, res, next) {
  if (req.session.auth) {
    next();
  } else {
    res.redirect('');
  }
}

// Запуск веб-сервера по адресу http://localhost:3000
app.listen(3005)

/**
 * Маршруты
 */
app.get('/', (req, res) => {
  connection.query("SELECT * FROM all_products ORDER BY id DESC LIMIT 5;", (err, data, fields) => {
    if (err) throw err;

    res.render('home', {
      'all_products': data,
      auth: req.session.auth
    });
  });
});
app.get('/catalog', (req, res) => {
  connection.query("SELECT * FROM category WHERE groups = 'category'", (err, data, fields) => {
    if (err) throw err;
    res.render('catalog', {
      'category': data,
      auth: req.session.auth
    });
  });
});

app.get('/logout', (req, res) => {
  req.session.auth = false;
  res.redirect('/')
});

app.get('/add', (req, res) => {
  res.render('add', {
    auth: req.session.auth
  });
});

app.get('/about-us', (req, res) => {
  res.render('about-us', {
    auth: req.session.auth
  });
});

app.get('/auth', (req, res) => {
  res.render('auth', {
    auth: req.session.auth
  });
});

app.get('/lock', isAuth, (req, res) => {
  res.render('lock', {
    auth: req.session.auth
  });
});


// КНОПКИ

app.post('/store', (req, res) => {
  connection.query(
    "INSERT INTO category (title, image, href) VALUES (?, ?, ?)",
    [[req.body.title], [req.body.image], [req.body.href]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('/')
    });
})

app.post('/store-add', (req, res) => {
  connection.query(
    "INSERT INTO aot (title, image, price, description) VALUES (?, ?, ?, ?)",
    [[req.body.title], [req.body.image], [req.body.price], [req.body.description]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('/aot')
    });
})
app.post('/store-add-gensh', (req, res) => {
  connection.query(
    "INSERT INTO genshinimpact (title, image, price, description) VALUES (?, ?, ?, ?)",
    [[req.body.title], [req.body.image], [req.body.price], [req.body.description]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('/GenshinImpact')
    });
})


app.post('/delete', (req, res) => {
  connection.query(
    "DELETE FROM items WHERE id=?;",
    [[req.body.id]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('/')
    });
})

app.post('/home-delete', (req, res) => {
  connection.query(
    "DELETE FROM items WHERE id=?;",
    [[req.body.id]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('/')
    });
})

app.post('/item-delete', (req, res) => {
  connection.query(
    "DELETE FROM items WHERE id=?;",
    [[req.body.id]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('/')
    });
})

app.post('/update', (req, res) => {
  connection.query(
    "UPDATE items SET title=?, description=?, image=?  WHERE id=?;",
    [[req.body.title], [req.body.description], [req.body.image], [req.body.id]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('/')
    });
})

app.post("/upload", upload.single("image"), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(
    __dirname,
    "./public/img/category/catalog/" + req.file.originalname
  );

  fs.rename(tempPath, targetPath, (err) => {
    if (err) console.log(err);

    res.redirect('/add');
  });
});
app.post("/upload-gensh", upload.single("image"), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(
    __dirname,
    "./public/img/product/" + req.file.originalname
  );

  fs.rename(tempPath, targetPath, (err) => {
    if (err) console.log(err);

    res.redirect('/GenshinImpact');
  });
});


app.post('/register', (req, res) => {
  connection.query(
    "SELECT * FROM users WHERE name=?",
    [[req.body.name], [req.body.password]], (err, data, fields) => {
      if (err) throw err;
      let salt = 10;
      let password = req.body.password;
      if (data.length == 0) {
        bcrypt.hash(password, salt, (err, hash) => {
          connection.query(
            "INSERT INTO users (name, email, password) VALUES (?,?, ?)",
            [[req.body.name], [req.body.email], hash], (err, data, fields) => {
              if (err) throw err;
              req.session.auth = true;
              res.redirect('/');
            });
        });
      }
      else {
        req.session.auth = false;
        res.redirect('/auth');
        console.log("This login is already occupied");
      }

    })
});

app.post('/login', (req, res) => {
  connection.query(
    "SELECT * FROM users WHERE name=?",
    [[req.body.name]], (err, data, fields) => {
      if (err) throw err;
      if (data.length > 0) {
        let hash = data[0].password;
        let password = req.body.password;
        connection.query(
          "SELECT * FROM users WHERE name=? and password=?",
          [[req.body.name], [req.body.password]], (err, data, fields) => {
            if (err) throw err;
            bcrypt.compare(password, hash, (err, result) => {
              if (result == true) {
                req.session.auth = true;
                res.redirect('/');
              }
              else {

                req.session.auth = false;
                res.redirect('/auth');
              }
            });
          });
      }
      else {

        req.session.auth = false;
        res.redirect('/auth');
      }


    });
});



// КОРЗИНА

app.get('/shopping_cart', isAuth, (req, res) => {
  connection.query(
    "SELECT * FROM shopping_cart", (err, data, fields) => {
      if (err) throw err;
      res.render('shopping_cart', {
        'shopping_cart': data,
        'all_products': data,
        auth: req.session.auth
      });
    });
});
app.get('/shopping_cart/:article', isAuth, (req, res) => {
  connection.query(
    "SELECT * FROM all_products WHERE article = ?", [req.params.article], (err, data, fields) => {
      if (err) throw err;
      res.render('item', {
        'shopping_cart': data,
        'all_products': data,
        auth: req.session.auth
      });
    });
});

app.post('/cart_add', (req, res) => {
  connection.query(
    "SELECT * FROM shopping_cart WHERE title=?",
    [[req.body.title]], (err, data, fields) => {
      if (err) throw err;
      if (data.length == 0 & req.session.auth==true) {
        connection.query(
          "INSERT INTO shopping_cart (article, href, title, description, image, price) VALUES (?, ?, ?, ?, ?, ?)",
          [[req.body.article], [req.body.href], [req.body.title], [req.body.description], [req.body.image], [req.body.price]], (err, data, fields) => {
            if (err) throw err;
            console.log(req.body.href);
          });
      }
      else{
          alert('Товар уже добавлен в корзину или вы не вошли в аккаунт!')
      }
    });
});

app.post('/cart-del', (req, res) => {
  connection.query(
    "DELETE FROM shopping_cart WHERE id=?;",
    [[req.body.id]], (err, data, fields) => {
      if (err) throw err;

      res.redirect('/shopping_cart')
    });
})
// КАТЕГОРИИ

app.get('/anime', (req, res) => {
  connection.query("SELECT * FROM category where groups = 'anime'", (err, data, fields) => {
    if (err) throw err;
    res.render('category/anime', {
      'anime': data,
      auth: req.session.auth
    });
  });
});
app.get('/games', (req, res) => {
  connection.query("SELECT * FROM category where groups = 'games'", (err, data, fields) => {
    if (err) throw err;
    res.render('category/games', {
      'games': data,
      auth: req.session.auth
    });
  });
});
app.get('/music', (req, res) => {
  connection.query("SELECT * FROM category where groups = 'music'", (err, data, fields) => {
    if (err) throw err;
    res.render('category/music', {
      'music': data,
      auth: req.session.auth
    });
  });
});
app.get('/cartoon', (req, res) => {
  connection.query("SELECT * FROM category where groups = 'cartoon'", (err, data, fields) => {
    if (err) throw err;
    res.render('category/cartoon', {
      'cartoon': data,
      auth: req.session.auth
    });
  });
});
app.get('/fanko_pop', (req, res) => {
  connection.query("SELECT * FROM category where groups = 'fanko_pop'", (err, data, fields) => {
    if (err) throw err;
    res.render('category/fanko_pop', {
      'fanko_pop': data,
      auth: req.session.auth
    });
  });
});
app.get('/movies', (req, res) => {
  connection.query("SELECT * FROM category where groups = 'movies'", (err, data, fields) => {
    if (err) throw err;
    res.render('category/movies', {
      'movies': data,
      auth: req.session.auth
    });
  });
});
app.get('/clothes', (req, res) => {
  connection.query("SELECT * FROM category where groups = 'clothes'", (err, data, fields) => {
    if (err) throw err;
    res.render('category/clothes', {
      'clothes': data,
      auth: req.session.auth
    });
  });
});

// КАТАЛОГ
// АНИМЕ
app.get('/aot', (req, res) => {
  connection.query("SELECT * FROM all_products WHERE category = 'aot'", (err, data, fields) => {
    if (err) throw err;
    res.render('catalog/anime/aot', {
      'all_products': data,
      auth: req.session.auth
    });
  });
});
app.get('/aot/:id', (req, res) => {
  connection.query("SELECT * FROM all_products WHERE id=?", [req.params.id],
    (err, data, fields) => {
      if (err) throw err;

      res.render('item', {
        'all_products': data[0],
        auth: req.session.auth
      });
    });
});
app.get('/DemonSlayer', (req, res) => {
  connection.query("SELECT * FROM all_products WHERE category = 'demonslayer'", (err, data, fields) => {
    if (err) throw err;
    res.render('catalog/anime/DemonSlayer', {
      'all_products': data,
      auth: req.session.auth
    });
  });
});
app.get('/DemonSlayer/:id', (req, res) => {
  connection.query("SELECT * FROM all_products WHERE id=?", [req.params.id],
    (err, data, fields) => {
      if (err) throw err;

      res.render('item', {
        'all_products': data[0],
        auth: req.session.auth
      });
    });
});
app.get('/OnePanchMan', (req, res) => {
  connection.query("SELECT * FROM all_products WHERE category = 'onepanchman'", (err, data, fields) => {
    if (err) throw err;
    res.render('catalog/anime/OnePanchMan', {
      'all_products': data,
      auth: req.session.auth
    });
  });
});
app.get('/OnePanchMan/:id', (req, res) => {
  connection.query("SELECT * FROM all_products WHERE id=?", [req.params.id],
    (err, data, fields) => {
      if (err) throw err;

      res.render('item', {
        'all_products': data[0],
        auth: req.session.auth
      });
    });
});
// ИГРЫ
app.get('/GenshinImpact', (req, res) => {
  connection.query("SELECT * FROM all_products WHERE category = 'genshinimpact'", (err, data, fields) => {
    if (err) throw err;
    res.render('catalog/games/GenshinImpact', {
      'all_products': data,
      auth: req.session.auth
    });
  });
});
app.get('/GenshinImpact/:id', (req, res) => {
  connection.query("SELECT * FROM all_products WHERE id=?", [req.params.id], (err, data, fields) => {
    if (err) throw err;
    res.render('item', {
      'all_products': data[0],
      auth: req.session.auth
    });
  });
});
