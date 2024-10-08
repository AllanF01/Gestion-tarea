const { MongoClient, ObjectId } = require('mongodb');
const uri = "mongodb://localhost:27017"; 
const client = new MongoClient(uri);

let db;

async function connect() {
  if (!db) {
    try {
      await client.connect();
      console.log("Conectado a MongoDB");
      db = client.db("gestion_tareas");
    } catch (err) {
      console.error(err);
    }
  }
  return db;
}

module.exports = connect;

async function crearUsuario(usuario) {
  try {
    const db = await connect();
    const resultado = await db.collection('usuarios').insertOne(usuario);
    console.log('Usuario insertado:', resultado.insertedId);
  } catch (err) {
    console.error('Error al crear usuario:', err);
  }
}

crearUsuario({
  nombre: "",
  email: "",
  password: "",
  rol: "",
  fechaCreacion: new Date()
});

async function obtenerTareasDeUsuario(userId) {
  try {
    const db = await connect();

    if (!ObjectId.isValid(userId)) {
      console.error('El userId no es un ObjectId válido');
      return;
    }

    const tareas = await db.collection('tareas').find({ usuarioAsignado: new ObjectId(userId) }).toArray();
    console.log(tareas);
  } catch (err) {
    console.error('Error al obtener tareas:', err);
  }
}

async function crearTarea(tarea) {
  try {
    const db = await connect();

    if (!ObjectId.isValid(tarea.usuarioAsignado)) {
      console.error('El userId no es un ObjectId válido');
      return;
    }

    const resultado = await db.collection('tareas').insertOne({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      estado: tarea.estado || 'pendiente',
      prioridad: tarea.prioridad || 'media',
      fechaVencimiento: tarea.fechaVencimiento || null,
      usuarioAsignado: new ObjectId(tarea.usuarioAsignado),
      fechaCreacion: new Date()
    });

    console.log('Tarea insertada:', resultado.insertedId);
  } catch (err) {
    console.error('Error al crear tarea:', err);
  }
}

crearTarea({
  titulo: "",
  descripcion: "",
  estado: "",
  prioridad: "",
  fechaVencimiento: new Date("2024-10-10"),
  usuarioAsignado: ""
});

async function eliminarTarea(taskId) {
  try {
    const db = await connect();

    if (!ObjectId.isValid(taskId)) {
      console.error('El taskId no es un ObjectId válido');
      return;
    }

    const resultado = await db.collection('tareas').deleteOne({ _id: new ObjectId(taskId) });

    if (resultado.deletedCount === 1) {
      console.log('Tarea eliminada correctamente');
    } else {
      console.log('No se encontró la tarea para eliminar');
    }
  } catch (err) {
    console.error('Error al eliminar tarea:', err);
  }
}

eliminarTarea("");

obtenerTareasDeUsuario("");
