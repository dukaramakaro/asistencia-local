const { usuariosDB } = require('./db');

// Crear usuario admin por defecto
const crearUsuarioAdmin = () => {
  try {
    // Verificar si ya existe un usuario admin
    const adminExistente = usuariosDB.buscarPorUsuario('admin');
    
    if (adminExistente) {
      console.log('✅ Usuario admin ya existe');
      return;
    }

    // Crear usuario admin
    const admin = {
      usuario: 'admin',
      password: 'admin123', // En producción, esto debería estar hasheado
      nombre: 'Administrador',
      rol: 'admin'
    };

    usuariosDB.crear(admin);
    console.log('✅ Usuario admin creado exitosamente');
    console.log('   Usuario: admin');
    console.log('   Contraseña: admin123');
  } catch (error) {
    console.error('❌ Error creando usuario admin:', error);
  }
};

crearUsuarioAdmin();