const { MongoClient, ObjectId } = require('mongodb');
const readlineSync = require('readline-sync');

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
      console.error("Error al conectar a MongoDB:", err);
    }
  }
  return db;
}

async function crearUsuario(usuario) {
  try {
    const db = await connect();
    const resultado = await db.collection('usuariosTarea').insertOne(usuario);
    console.log('Usuario insertado:', resultado.insertedId);
    console.log("\n------------------------\n");
  } catch (err) {
    console.error('Error al crear usuario:', err);
  }
}

async function obtenerTareasDeUsuario(userId) {
  try {
    const db = await connect();

    if (!ObjectId.isValid(userId)) {
      console.error('El userId no es un ObjectId válido');
      return;
    }

    const tareas = await db.collection('tareas').find({ usuarioAsignado: new ObjectId(userId) }).toArray();
    console.log("Tareas del usuario:");
    console.log(tareas);
    console.log("\n------------------------\n");
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
      fechaCreacion: new Date(),
      completada: false 
    });

    console.log('Tarea insertada:', resultado.insertedId);
    console.log("\n------------------------\n"); 
  } catch (err) {
    console.error('Error al crear tarea:', err);
  }
}

async function eliminarTarea(taskId) {
  try {
    const db = await connect();

    if (!ObjectId.isValid(taskId)) {
      console.error('El taskId no es un ObjectId valido');
      return;
    }

    const resultado = await db.collection('tareas').deleteOne({ _id: new ObjectId(taskId) });

    if (resultado.deletedCount === 1) {
      console.log('Tarea eliminada correctamente');
    } else {
      console.log('No se encontro la tarea para eliminar');
    }
    console.log("\n------------------------\n");
  } catch (err) {
    console.error('Error al eliminar tarea:', err);
  }
}

async function obtenerTareasCompletadasPorUsuario() {
  try {
    const db = await connect();
    
    const resultado = await db.collection('tareas').aggregate([
      { $match: { completada: true } },
      { 
        $group: {
          _id: "$usuarioAsignado",
          tareasCompletadas: { $push: "$titulo" }, 
          totalCompletadas: { $sum: 1 } 
        }
      },
      {
        $lookup: {
          from: "usuariosTarea",
          localField: "_id",
          foreignField: "_id",
          as: "usuarioInfo"
        }
      },
      { $unwind: "$usuarioInfo" },
      {
        $project: {
          "usuarioInfo.nombre": 1,
          "usuarioInfo.email": 1,
          "tareasCompletadas": 1,
          "totalCompletadas": 1
        }
      }
    ]).toArray();

    console.log("Tareas completadas por usuario:");
    console.log(resultado);
    console.log("\n------------------------\n");
  } catch (err) {
    console.error("Error al obtener tareas completadas por usuario:", err);
  }
}

async function marcarTareaCompletada(taskId) {
  try {
    const db = await connect();

    if (!ObjectId.isValid(taskId)) {
      console.error('El taskId no es un ObjectId válido');
      return;
    }

    const resultado = await db.collection('tareas').updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { completada: true } }
    );

    if (resultado.modifiedCount === 1) {
      console.log('Tarea marcada como completada');
    } else {
      console.log('No se encontro la tarea para actualizar');
    }
    console.log("\n------------------------\n");
  } catch (err) {
    console.error('Error al marcar tarea como completada:', err);
  }
}

async function menu() {
  console.log("Selecciona una opcion:");
  console.log("1. Crear un nuevo usuario");
  console.log("2. Crear una tarea");
  console.log("3. Ver tareas de un usuario");
  console.log("4. Eliminar tarea");
  console.log("5. Ver tareas completadas por usuario");
  console.log("6. Marcar tarea como completada");
  console.log("7. Salir");

  const opcion = readlineSync.questionInt("Ingresa el numero de la opcion: ");

  switch (opcion) {
    case 1:
      const nombre = readlineSync.question("Nombre del usuario: ");
      const email = readlineSync.question("Email del usuario: ");
      const rol = readlineSync.question("Rol del usuario: ");
      await crearUsuario({
        nombre,
        email,
        password: "1234",
        rol,
        fechaCreacion: new Date()
      });
      break;
    case 2:
      const titulo = readlineSync.question("Titulo de la tarea: ");
      const descripcion = readlineSync.question("Descripcion de la tarea: ");
      const usuarioId = readlineSync.question("ID del usuario asignado: ");
      await crearTarea({
        titulo,
        descripcion,
        estado: "pendiente",
        prioridad: "media",
        fechaVencimiento: null,
        usuarioAsignado: usuarioId
      });
      break;
    case 3:
      const idUsuario = readlineSync.question("ID del usuario para ver sus tareas: ");
      await obtenerTareasDeUsuario(idUsuario);
      break;
    case 4:
      const taskId = readlineSync.question("ID de la tarea a eliminar: ");
      await eliminarTarea(taskId);
      break;
    case 5:
      await obtenerTareasCompletadasPorUsuario();
      break;
    case 6:
      const tareaId = readlineSync.question("ID de la tarea a marcar como completada: ");
      await marcarTareaCompletada(tareaId);
      break;
    case 7:
      console.log("¡Hasta luego!");
      client.close();
      return;
    default:
      console.log("Opcion no valida.");
  }

  readlineSync.question("\nPresiona enter para continuar...\n");

  await menu();
}

menu();