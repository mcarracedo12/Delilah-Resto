DROP DATABASE if exists DelilahResto; 

CREATE DATABASE DelilahResto;

-- // GENERO TODAS LAS TABLAS

CREATE TABLE DelilahResto.Estados(
    Id INT(4) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    Descripcion VARCHAR(15) NOT NULL DEFAULT 'Nuevo')
ENGINE = InnoDB DEFAULT CHARSET = utf8;

INSERT INTO DelilahResto.Estados(Id, Descripcion)
VALUES(1, 'Nuevo'),
(2, 'Confirmado'),
(3, 'Preparando'),
(4, 'Enviando'),
(5, 'Entregado'),
(6, 'Cancelado'),
(7, 'Anulado por cliente');

CREATE TABLE DelilahResto.TipoUsuario(
    Id INT(4) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    Descripcion VARCHAR(8) NOT NULL)
ENGINE = InnoDB DEFAULT CHARSET = utf8;

INSERT INTO DelilahResto.TipoUsuario(Id, Descripcion)
VALUES(1, 'Client'),
(2, 'Admin');

CREATE TABLE DelilahResto.Usuarios (
    Id INT(4) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    Username VARCHAR(15) UNIQUE NOT NULL,
    NombreApellido VARCHAR(30) NOT NULL,
    Mail VARCHAR(30) NOT NULL,
    Telefono INT(8) NOT NULL,
    Direccion VARCHAR(30) NOT NULL,
    Pwd VARCHAR(15) NOT NULL,
    TipoUsuario INT(4) UNSIGNED,
    FOREIGN KEY (TipoUsuario) REFERENCES DelilahResto.TipoUsuario(Id))

ENGINE = InnoDB DEFAULT CHARSET = utf8;

INSERT INTO DelilahResto.Usuarios (Id, Username, NombreApellido, Mail, Telefono, Direccion, Pwd, TipoUsuario)
VALUES (1, "Admin", "Admin", "none", 0, "none", "Admin", 2),
(2, "Cliente", "Cliente", "none", 0, "none", "Cliente", 1);

CREATE TABLE DelilahResto.Productos(
    Id INT(4) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    Nombre VARCHAR(20) UNIQUE NOT NULL,
    Descripcion varchar(40) NOT NULL,
    Precio DEC(11) NOT NULL,
    Imagen BLOB)
ENGINE = InnoDB DEFAULT CHARSET = utf8;

CREATE TABLE DelilahResto.FormaPago(
    Id INT(4) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    Descripcion VARCHAR(15)  NOT NULL)
ENGINE = InnoDB DEFAULT CHARSET = utf8;

INSERT INTO DelilahResto.FormaPago(Id, Descripcion)
VALUES(1, 'Efectivo'),
(2, 'Débito'),
(3, 'Crédito'),
(4, 'Transferencia');

CREATE TABLE DelilahResto.Pedidos(
    Id INT(4) UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    Estado INT(4) UNSIGNED NOT NULL,
    FOREIGN KEY (Estado) REFERENCES DelilahResto.Estados(Id),
    Fecha TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    -- Hora TIME NOT NULL,
    Descripcion VARCHAR(15) NOT NULL,
    FormaPago INT(4) UNSIGNED NOT NULL,
    FOREIGN KEY (FormaPago) REFERENCES DelilahResto.FormaPago(Id),
    Usuario INT(4) UNSIGNED NOT NULL,
    FOREIGN KEY (Usuario) REFERENCES DelilahResto.Usuarios(Id))
ENGINE = InnoDB DEFAULT CHARSET = utf8;

CREATE TABLE DelilahResto.ProductosPorPedidos(
    PedidoId INT(4) UNSIGNED, 
    FOREIGN KEY (PedidoId) REFERENCES DelilahResto.Pedidos(Id),
    ProductoId INT(4) UNSIGNED, 
    FOREIGN KEY (ProductoId) REFERENCES DelilahResto.Productos(Id),
    Cantidad INT (2) UNSIGNED)
ENGINE = InnoDB DEFAULT CHARSET = utf8;


INSERT INTO DelilahResto.Productos(Id, Nombre, Descripcion, Precio, Imagen)
VALUES(1, 'Hamburguesa simple', 'Hamburguesa con lechuga y tomate', '50', NULL),
(2, 'Cheeseburger', 'Hamburguesa con queso', '50', NULL);