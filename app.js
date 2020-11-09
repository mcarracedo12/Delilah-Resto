const express = require("express");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.json());
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
// import {swaggerDocument} from "./swagger";
const swaggerJsDoc = require("swagger-jsdoc");
///////////////////////////////////////////////////////////////////////////////////////////////////////////

/// MYSQL TO CONNECT TO DATABASE
var mysql = require("mysql2");

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "DelilahResto"
})

connection.connect(error => {
    if (error) throw error;
    console.log("Connection to database 'DelilahResto' running");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server listening on port '${port}'`);
});



//////////////////////////////////////////////  DOCUMENTATION ///////////////////////////////////////////////////////////////

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: "Delilah Resto API",
            descripcion: "API for managing orders for a restaurant",
            contact: {
                name: "Marina Carracedo"
            },
            servers: [`http:localhost:'${port}'`]
        }
    },
    apis: ["app.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));


/////////////////////////////////////////   ROUTES    ////////////////////////////////////////////////////////////////////

/**
 * @swagger
 * /login:
 *  post:
 *      summary: Logs user into the system
 *      description: Logs user into the system, returns token with userId and tipoUsuario decoded
 *      consumes:
 *          - application/json
 *      produces:
 *          - application/json
 *      parameters:
 *          - name: login
 *            in: body
 *            required: true
 *            schema:
 *              type: object
 *              required:
 *                  - username
 *                  - pwd
 *              properties:
 *                  username: 
 *                      type: string
 *                      example: Admin
 *                  pwd:
 *                      type: string
 *                      example: Admin
 *      responses:
 *          "200":
 *              description: token
 *          "400":
 *              description: Usuario o contraseña inválidos
 */


app.post("/login", (req, res) => {

    const { username, pwd } = req.body

    const sql = "SELECT * FROM usuarios WHERE usuarios.username = '" + username + "' and usuarios.pwd = '" + pwd + "'";

    connection.query(sql, (error, results) => {
        if (error)
            throw error;
        if (results.length == 0) {
            res.status(400).json({ message: "Usuario o contraseña inválidos" });
        } else {
            const token = jwt.sign({ "userId": results[0].Id, "tipoUsuario": results[0].TipoUsuario }, "llave");
            res.json({ token });
        }
    });

});

//////////////////////////////// FIN DE LOGIN /////////////////////////////


///////////////////////////////  MIDDLEWARE ////////////////////////////////


const rutasProtegidas = express.Router();
rutasProtegidas.use((req, res, next) => {
    const token = req.headers['access-token'];

    if (token != null) {
        jwt.verify(token, 'llave', (err, decoded) => {
            if (err) {
                return res.json({ mensaje: 'Token inválida' });
            } else {
                req.headers['userId'] = decoded.userId;
                req.headers['tipoUsuario'] = decoded.tipoUsuario;
                next();
            }
        });
    } else {
        res.status("201").send('Token no proveída.');
    }
});

/////////////////////////////// END OF MIDDLEWARE ////////////////////////////////

//////////////////////////////////////// ENDPOINTS  ///////////////////////////////

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Creates a new user
 *     description: New users must have a unique username. Users tipoUsuario are by default 1 (Clients), and have no authorization to retrieve other users' information. Only Admin users can change tipoUsuario from client to admin 
 *     consumes: 
 *       - application/json
 *     produces:
 *       - string
 *     parameters:
 *       - in: body
 *         name: usuarioObj
 *         description: User object that needs to be added
 *         required: true
 *         schema:
 *          type: object
 *          required:
 *              - username
 *              - NombreApellido
 *              - mail
 *              - telefono
 *              - direccion
 *              - pwd    
 *          properties:
 *              username:
 *                  type: string
 *                  example: mcarracedo
 *              NombreApellido:
 *                  type: string
 *              mail:
 *                  type: string
 *              telefono:
 *                  type: integer
 *                  format: int32
 *              direccion:
 *                  type: string
 *              pwd:
 *                  type: string
 *              tipoUsuario:
 *     responses:
 *      "200":
 *          description: Nuevo cliente registrado
 */
app.post("/register", (req, res) => {
    let sql = "INSERT INTO usuarios SET ?";
    let usuarioObj = {
        username: req.body.username,
        NombreApellido: req.body.NombreApellido,
        mail: req.body.mail,
        telefono: req.body.telefono,
        direccion: req.body.direccion,
        pwd: req.body.pwd,
        tipoUsuario: 1
    }
    connection.query(sql, usuarioObj, error => {
        if (error) res.send(error);
        else {
            res.send("Nuevo cliente registrado");
        }
    });
});


// SOLO ADMIN (tipo de usuario 2) puede ver todos los usuarios

/**
 * @swagger
 * /usuarios:
 *  get:
 *      summary: Gets users
 *      description: Use to request all users if the user is Admin. If the user is not admin, it gets only my user information.
 *      produces:
 *          - application/json
 *      responses:
 *          "200":
 *              description: Lista de usuarios disponibles
 *              schema:
 *                  $ref: '#/definitions/Usuarios'
 *          "201":
 *              description: Token no proveída.
 *          "404":
 *              description: No hay usuarios todavía
 *              schema:
 *                  type: array
 *                  items:
 *                      $ref: '#/definitions/Usuarios'
 *      security: [
 *          {
 *              access-token: []
 *          }
 *      ]
 */
app.get('/usuarios', rutasProtegidas, (req, res) => {
    if (req.headers['tipoUsuario'] != 2) {
        let userId = req.headers['userId'];
        let misql = `SELECT * FROM usuarios WHERE id = '${userId}'`;
        connection.query(misql, (err, user) => {
            if (err) throw err;
            else { res.json(user) };
        });
    }
    else {
        let sql = 'SELECT * FROM usuarios';
        connection.query(sql, (error, results) => {
            if (error) throw error;
            if (results.length > 0) {
                res.json(results);
            } else {
                res.status(404).send("No hay usuarios todavía");
            }
        });
    }
});

/**
 * @swagger
 * /usuarios/{id}:
 *  put:
 *      summary: It changes the type of user (Client / Admin)
 *      description: Use to change the tipoUsuario value of the users. If tipoUsuario is 1, then the user is a Client, users with tipoUsuario 2 are Admins. Only Admins can access this point
 *      consumes:
 *          - multipart/form-data
 *      produces:
 *          - application/json
 *      parameters:     
 *          - name: id
 *            in: path
 *            description: Id of the user that needs to be updated
 *            required: true
 *            type: integer
 *            format: int64
 *          - name: body
 *            in: body
 *            description: 1 for Client users, 2 for Admin users
 *            required: true
 *            schema:
 *              type: object
 *              required:
 *                  - tipoUsuario
 *              properties:
 *                  tipoUsuario:
 *                      type: integer
 *                      format: int64
 *                      example: 2
 *      responses:
 *          "200":
 *              description: Tipo de usuario actualizado.
 *          "201":
 *              description: Token no proveída.
 *          "202":
 *              description: No tiene permisos de Admin para modificar a este usuario.
 *          "404":
 *              description: El usuario no existe.
 *      security: [
 *          {
 *              access-token:[]
 *          }
 *      ]
 */

// En postman funciona bien, pero en swagger me dice que no existe el usuario

app.put("/usuarios/:id", rutasProtegidas, (req, res) => {
    if (req.headers['tipoUsuario'] != 2) {
        res.status("202").send("No tiene permisos de Admin para modificar a este usuario.");
    }
    else {
        let { id } = req.params;
        let tipoUsuario = req.body.tipoUsuario;
        let sql1 = `SELECT * FROM usuarios WHERE Id = '${id}'`;
        let sql = `UPDATE usuarios SET tipoUsuario = '${tipoUsuario}'
WHERE id = '${id}'`;
        if (connection.query(sql1, (error, resp) => {
            if (error) throw error;
            if (resp.length !== 1) {
                res.send("El usuario no existe.");
            }
            else {
                connection.query(sql, err => {
                    if (err) throw err;
                    else { res.send("Tipo de usuario actualizado."); }
                });
            }
        }));
    }
}
);


/**
 * @swagger
 * /productos/{id}:
 *  put:
 *      summary: Modifies products from the menu
 *      description: Only Admin users can access
 *      consumes:
 *          - application/json
 *      produces:
 *          - string
 *      parameters:
 *          - name: id
 *            in: path
 *            description: Id of the product that needs to be updated
 *            required: true
 *            type: integer
 *          - in: body
 *            name: producto
 *            description: Product object that needs to be updated
 *            required: true
 *            schema:            
 *              type: object
 *              $ref: '#/definitions/Productos'
 *      responses:
 *          "200":
 *              description: Producto modificado
 *          "201":
 *              description: Token no proveída.
 *          "202":
 *              description: No tiene permisos de Admin para modificar este producto
 *      security: [
 *          {
 *              access-token:[]
 *          }
 *      ]
 */
app.put("/productos/:id", rutasProtegidas, (req, res) => {
    if (req.headers['tipoUsuario'] != 2) {
        res.status(202).send("No tiene permisos de Admin para modificar este producto");
    }
    let { id } = req.params;
    let nombre = req.body.nombre;
    let descripcion = req.body.descripcion;
    let precio = req.body.precio;
    let sql = `UPDATE productos SET nombre = '${nombre}', descripcion = '${descripcion}', precio ='${precio}'
WHERE id = '${id}'`;
    let sql1 = `SELECT * FROM productos WHERE Id = '${id}'`;
    if (connection.query(sql1, (error, resp) => {
        if (error) {res.send(error)}
        if (resp.length !== 1) {
            res.status(404).send("El producto no existe");
        }
        else {
            connection.query(sql, err => {
                if (err){res.send(err)}
                else {res.send("Producto modificado"); }
            });
        }
    }));

}
);


/**
 * @swagger
 * /productos:
 *  get:
 *      summary: Retrieves all products from the menu.
 *      description: Users don´t need to be logged in to access the menu.
 *      produces:
 *          - application/json
 *      responses:
 *          "200":
 *              description: Successful operation
 *              schema:
 *                  type: array
 *                  items: 
 *                      $ref: '#/definitions/Productos'
 *          "203":
 *              description: No hay productos todavía
 */
app.get("/productos", (req, res) => {
    const sql = 'SELECT * FROM productos';
    connection.query(sql, (error, results) => {
        if (error) throw error;
        if (results.length > 0) {
            res.json(results);
        } else {
            res.status(203).send("No hay productos todavia");
        }
    });
});

/**
 * @swagger
 * /productos:
 *  post:
 *      summary: Adds product to the menu
 *      description: Only admin users can add products to the menu
 *      consumes:
 *          - application/json
 *      produces:
 *          - application/json
 *      parameters:
 *          - in: body
 *            name: body
 *            description: Producto object that needs to be added to the menu
 *            required: true
 *            schema: 
 *              $ref: '#/definitions/Productos'
 *      responses:
 *          "200":
 *              description: Producto agregado al menu por Admin.
 *          "201":
 *              description: No token proveida.
 *          "202":
 *              description: No tiene permisos para agregar producto.
 *      security: [
 *          {
 *              access-token: []
 *          }
 *      ]
 */
app.post("/productos", rutasProtegidas, (req, res) => {
    if (req.headers['tipoUsuario'] != 2) {
        res.status(202).send("No tiene permisos para agregar producto.")
    }
    else {
        let sql = "INSERT INTO productos SET ?";
        let productoObj = {
            nombre: req.body.nombre,
            descripcion: req.body.descripcion,
            precio: req.body.precio
        }
        connection.query(sql, productoObj, error => {
            if (error) throw error;
            else {
                res.send("Producto agregado al menu por Admin.");
            }
        });
    }
});

/**
 * @swagger
 * /productos/{id}:
 *  delete:
 *      summary: Eliminates a product from the menu
 *      description: Only Admin users can delete products.
 *      parameters: 
 *          - name: access-token
 *            in: headers
 *            required: true
 *            type: string
 *          - name: id
 *            in: path
 *            description: Id of the product that needs to be deleted
 *            required: true
 *            type: integer
 *            format: int64
 *      responses: 
 *          "200":
 *              description: Producto eliminado.
 *          "201": 
 *              description: Token no proveída.
 *          "202":
 *              description: No tiene permisos de Admin para eliminar productos.
 *      security: [
 *          {
 *              access-token: []
 *          }
 *      ] 
 */
app.delete("/productos/:id", rutasProtegidas, (req, res) => {
    if (req.headers['tipoUsuario'] != 2) {
        res.status(202).send("No tiene permisos de Admin para eliminar productos.")
    }
    let { id } = req.params;
    let sql1 = `SELECT * FROM productos WHERE Id = '${id}'`;
    let sql = `DELETE FROM productos WHERE productos.Id = '${id}'`;
    if (connection.query(sql1, (error, resp) => {
        if (error) throw error
        if (resp.length !== 1) {
            res.status(404).send("El producto no existe");
        }
        else {


            connection.query(sql, err => {
                if (err) {
                    res.status(400).send("No se puede eliminar un producto que esté vinculado a un pedido");
                }
                else {
                    res.send("Producto eliminado.");
                }
            });
        }

    }));

}
);

/**
 * @swagger
 * /pedidos:
 *  get:
 *      summary: Gets orders
 *      description: Use to request all orders if the user is Admin. If the user is not admin, it gets only my order information.
 *      produces:
 *          - application/json
 *      consumes: 
 *          - access-token:
 *              in: headers
 *              name: access-token
 *              type: apiKey
 *      responses:
 *          "200":
 *              description: Lista de pedidos disponibles
 *              schema:
 *                  $ref: '#/definitions/Pedidos'
 *          "201":
 *              description: Token no proveída.
 *          "404":
 *              description: No hay pedidos todavía.
 *              schema:
 *                  type: array
 *                  items:
 *                      $ref: '#/definitions/Pedidos'
 *      security: [
 *          {
 *              access-token: []
 *          }
 *      ]
 */
app.get("/pedidos", rutasProtegidas, (req, res) => {
    if (req.headers['tipoUsuario'] != 2) {
        let userId = req.headers['userId'];
        let sql = `SELECT pedidos.*,  productosPorPedidos.* FROM pedidos LEFT JOIN productosPorPedidos ON productosPorPedidos.pedidoId = pedidos.Id WHERE usuario = "${userId}"`;
        connection.query(sql, (error, results) => {
            if (error) throw error;
            if (results.length > 0) {
                res.json(results);
            }
            else {
                res.status(404).send("No hay pedidos todavia.");
            }
        });
    }
    else {
        let sql = `SELECT pedidos.*,  productosPorPedidos.* FROM pedidos LEFT JOIN productosPorPedidos ON productosPorPedidos.pedidoId = pedidos.Id`;
        connection.query(sql, (error, results) => {
            if (error) throw error;
            if (results.length > 0) {
                res.json(results);
            }
            else {
                res.status(404).send("No hay pedidos todavia.");
            }
        });
    }
})

// Actualizar estado de pedido (solo admins)
/**
 * @swagger
 * /pedidos/{id}:
 *  put:
 *      summary: It changes the status of the order. 
 *      description: It can only be managed by Admin users.
 *      consumes:
 *          - multipart/form-data
 *      produces: 
 *          - application/json
 *      parameters:
 *          - name: id
 *            in: path
 *            description: Id of the order that needs to be updated
 *            required: true
 *            type: integer
 *          - name: estado
 *            in: body
 *            description: New order status (1, 'Nuevo'),(2, 'Confirmado'), (3, 'Preparando'), (4, 'Enviando'), (5, 'Entregado'), (6, 'Cancelado')
 *            required: true
 *            schema:
 *              type: object
 *              required:
 *                  - estado
 *              properties:
 *                  estado:
 *                      type: integer
 *                      format: int64
 *      responses:
 *          "200":
 *              description: Estado de pedido actualizado.
 *          "201":
 *              description: Token no proveída.
 *          "202":
 *              description: No tiene permisos de Admin para modificar estado del pedido.
 *      security: [
 *          {
 *              access-token:[]
 *          }
 *      ]
 */
app.put("/pedidos/:id", rutasProtegidas, (req, res) => {
    if (req.headers['tipoUsuario'] != 2) {
        res.status(202).send("No tiene permisos de Admin para modificar estado del pedido.");
    }
    else {
        let { id } = req.params;
        let estado = req.body.estado;
        let sql = `UPDATE pedidos SET estado = '${estado}'
WHERE id = '${id}'`;
        connection.query(sql, error => {
            if (error) throw error;
            else { res.send("Estado de pedido actualizado."); }
        });
    }
});


/**
 * @swagger
 * /pedidos:
 *   post:
 *     summary: Creates a new order
 *     description: Users must be logged in. 
 *     consumes: 
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: pedidoObj
 *         description: Order that needs to be placed
 *         required: true
 *         schema:
 *          type: object
 *          required:
 *              - descripcion
 *              - formaPago
 *              - pedidos
 *          properties:
 *              descripcion:
 *                  type: string
 *                  example: 2 x hamb
 *              formaPago:
 *                  type: integer
 *                  description: 1 - Efectivo // 2 - Debito // 3 - Credito // 4 - Transferencia
 *              pedidos:
 *                  schema:
 *                  type: array
 *                  items:
 *                      $ref: '#/definitions/ProductosPorPedido'
 *     responses:
 *      "201":
 *          description: Token no proveída.
 *      "200":
 *          description: Pedido generado (id) 
 *     security: [
 *      {
 *          access-token: []
 *      }
 *      ]
 * 
 */
app.post("/pedidos", rutasProtegidas, (req, res) => {
    let userId = req.headers['userId'];
    let pedidoCabecera = {
        usuario: userId,
        estado: 1,
        descripcion: req.body.descripcion,
        fecha: new Date(),
        formaPago: req.body.formaPago
    }
    connection.query(
        "INSERT INTO pedidos SET ?",
        pedidoCabecera,
        function (error, result) {
            if (!error) {
                let id = result.insertId;
                let productosPorPedido = [];
                req.body.pedidos.forEach(element => {
                    let producto = [
                        id,
                        element.productoId,
                        element.cantidad
                    ];
                    productosPorPedido.push(producto);
                });
                connection.query(
                    "INSERT INTO productosPorPedidos (pedidoId, productoId, cantidad) VALUES ?",
                    [productosPorPedido],
                    function (error1, response1) {
                        if (!error1) {
                            res.send("Pedido generado: " + id);
                        }
                        else {
                            throw error1;
                        }
                    });
            }
            else {
                throw error;
            }
        });
});


/**
 * @swagger
 * securityDefinitions:
 *  access-token:
 *      type: apiKey
 *      name: access-token
 *      in: header
 * definitions:
 *  Usuarios:
 *      type: object
 *      required:
 *          - id
 *          - username
 *          - NombreApellido
 *          - mail
 *          - telefono
 *          - direccion
 *          - pwd
 *          - tipoUsuario
 *      properties:
 *          id:
 *              type: integer
 *              format: int64
 *          username:
 *              type: string
 *              example: Admin
 *          NombreApellido:
 *              type: string
 *          mail:
 *              type: string
 *          telefono:
 *              type: integer
 *              format: int32
 *          direccion:
 *              type: string
 *          pwd:
 *              type: password
 *              example: Admin
 *          tipoUsuario:
 *              $ref: '#/definitions/TipoUsuario'
 *  TipoUsuario:
 *      type: object
 *      required:
 *          - descripcion
 *      properties:
 *          id:
 *              type: integer
 *              format: int64
 *              default: 1
 *          description:
 *              type: string
 *              example: Client
 *  Estados:
 *      type: object
 *      required:
 *          - descripcion
 *      properties:
 *          id:
 *              type: integer
 *              format: int64
 *          descripcion:
 *              type: string
 *              example: Nuevo
 *  Productos:
 *      type: object
 *      required:
 *          - nombre
 *          - descripcion
 *          - precio
 *      properties:
 *          id:
 *              type: integer
 *              format: int64
 *          nombre:
 *              type: string
 *              example: hamburguesa
 *          descripcion:
 *              type: string
 *              example: hamburguesa con lechuga y tomate
 *          precio:
 *              type: integer
 *              format: int32
 *          imagen:
 *              type: string
 *  FormaPago:
 *      type: object
 *      required:
 *          - descripcion
 *      properties:
 *          id:
 *              type: integer
 *              format: int64
 *          descripcion:
 *              type: string
 *              example: efectivo
 *  Pedidos:
 *      type: object
 *      required:
 *          - estado
 *          - fecha
 *          - descripcion
 *          - formaPago
 *          - usuario
 *      properties:
 *          id:
 *              type: integer
 *              format: int64
 *          estado:
 *              $ref: '#/definitions/Estados'
 *          fecha:
 *              type: date
 *          descripcion:
 *              type: string
 *              example: 2 x hambur
 *          formaPago:
 *              $ref: '#/definitions/FormaPago'
 *          usuario:
 *              $ref: '#/definitions/Usuarios'
 *  ProductosPorPedido:
 *      type: object
 *      required:
 *          - productoId
 *          - cantidad
 *      properties:
 *          productoId:
 *              type: integer
 *              format: int64
 *          cantidad: 
 *              type: integer
 *              format: int32
 *  ApiResponse:
 *      type: object
 *      properties:
 *          code:
 *              type: integer
 *              format: int32
 *          type:
 *              type: string
 *          message:
 *              type: string
 */



