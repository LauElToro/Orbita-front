import { Link } from 'react-router-dom';
import { PaginaSitio } from '../components/Sitio';
import { fecha } from '../format';
import { EMPRESA, VERSION_LEGAL } from './empresa';

export function Privacidad() {
  return (
    <PaginaSitio angosta>
      <article className="legal">
        <h1>Política de Privacidad</h1>
        <p className="muted">
          Versión {VERSION_LEGAL.privacidad} · Vigente desde el {fecha(VERSION_LEGAL.privacidad)}
        </p>

        <h2>1. Quién es el responsable</h2>
        <p>
          {EMPRESA.razonSocial}, CUIT {EMPRESA.cuit}, con domicilio en {EMPRESA.domicilio} (<strong>"Orbita"</strong>), es responsable de los
          datos personales de los visitantes del sitio y de los comercios que contratan el Servicio (los <strong>"Clientes"</strong>), conforme
          a la Ley 25.326 de Protección de los Datos Personales y su normativa complementaria. Contacto:{' '}
          <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>.
        </p>
        <p>
          Respecto de los datos de las personas que escriben a los Clientes (los <strong>"Contactos"</strong>), el responsable es cada Cliente y
          Orbita actúa como <strong>encargado del tratamiento</strong>: los trata solo por cuenta y según las instrucciones del Cliente, para
          prestar el Servicio. Si sos Contacto de un comercio, dirigí tus consultas a ese comercio; Orbita colaborará con él para responderlas.
        </p>

        <h2>2. Qué datos tratamos</h2>
        <ul>
          <li>
            <strong>De los Clientes:</strong> nombre, email, nombre y rubro del negocio, contraseña (guardada solo como hash irreversible), plan,
            medio de pago e historial de pagos, configuración del asistente y datos de uso del Servicio.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, navegador y fecha y hora de las aceptaciones de estos documentos y de los accesos, con
            fines de seguridad y prueba.
          </li>
          <li>
            <strong>De quienes nos consultan:</strong> los datos que completan en los formularios de contacto o de arrepentimiento.
          </li>
          <li>
            <strong>De los Contactos (como encargado):</strong> identificador asignado por ManyChat, nombre de perfil, contenido de los mensajes
            y, si corresponde, los turnos reservados.
          </li>
        </ul>
        <p>
          No almacenamos datos de tarjetas: los pagos con tarjeta los procesa Mercado Pago bajo su propia política. No solicitamos datos
          sensibles y pedimos a los Clientes que no los recolecten mediante el Servicio.
        </p>

        <h2>3. Para qué los usamos</h2>
        <ul>
          <li>Crear y administrar la cuenta y prestar el Servicio contratado.</li>
          <li>Generar las respuestas del asistente, registrar turnos y enviar recordatorios según el plan.</li>
          <li>Cobrar el abono, emitir comprobantes y cumplir obligaciones legales, contables e impositivas.</li>
          <li>Brindar soporte y enviar comunicaciones operativas (vencimientos, cambios en los documentos, avisos del Servicio).</li>
          <li>Prevenir fraudes, abusos e incidentes de seguridad.</li>
          <li>Mejorar el Servicio a partir de estadísticas agregadas o anonimizadas.</li>
        </ul>
        <p>
          <strong>No vendemos ni alquilamos datos personales.</strong> No usamos las conversaciones de los Contactos para publicidad ni para
          entrenar modelos propios, y procuramos contratar proveedores de inteligencia artificial que no usen los datos enviados por su API para
          entrenar sus modelos.
        </p>

        <h2>4. Base legal</h2>
        <p>
          Tratamos los datos con el consentimiento del titular, que se presta al aceptar esta Política, para ejecutar el contrato con el Cliente,
          y para cumplir obligaciones legales (art. 5 de la Ley 25.326). El consentimiento puede revocarse en cualquier momento, sin efecto
          retroactivo; revocarlo puede impedir seguir prestando el Servicio.
        </p>

        <h2>5. Con quién los compartimos</h2>
        <p>Solo con proveedores que necesitamos para prestar el Servicio, que actúan bajo obligaciones de confidencialidad y seguridad:</p>
        <ul>
          <li>infraestructura y alojamiento de servidores;</li>
          <li>proveedores de modelos de inteligencia artificial, que reciben el contenido necesario para generar cada respuesta;</li>
          <li>ManyChat y las plataformas de mensajería conectadas por el Cliente;</li>
          <li>Mercado Pago, para el cobro de los abonos;</li>
          <li>autoridades, cuando lo exija una ley o una orden judicial.</li>
        </ul>
        <p>
          Algunos de estos proveedores pueden almacenar datos fuera de la Argentina. En esos casos exigimos niveles de protección adecuados o
          cláusulas contractuales conforme al art. 12 de la Ley 25.326 y la Disposición 60/2016 de la Agencia de Acceso a la Información Pública.
          Al aceptar esta Política, el titular consiente esas transferencias.
        </p>

        <h2>6. Cuánto tiempo los conservamos</h2>
        <ul>
          <li>Datos de la cuenta: mientras esté activa y hasta 90 días después de la baja.</li>
          <li>Conversaciones: solo los últimos mensajes necesarios para dar contexto al asistente; se eliminan al dar de baja la cuenta.</li>
          <li>Comprobantes y registros contables: durante el plazo exigido por la ley (art. 328 del Código Civil y Comercial).</li>
          <li>Registros de aceptación de documentos legales: mientras puedan ser necesarios como prueba.</li>
        </ul>

        <h2>7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas y organizativas razonables: conexiones cifradas, credenciales de terceros cifradas con AES-256, contraseñas
          con hash, accesos restringidos y registros de actividad. Ningún sistema es completamente infalible; ante un incidente que afecte tus
          datos te informaremos y tomaremos las medidas a nuestro alcance.
        </p>

        <h2>8. Tus derechos</h2>
        <p>
          Podés pedir acceso, rectificación, actualización o supresión de tus datos escribiendo a{' '}
          <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> desde el email registrado. Respondemos los pedidos de acceso dentro de los 10
          días corridos y los de rectificación o supresión dentro de los 5 días hábiles (arts. 14 y 16 de la Ley 25.326).
        </p>
        <p className="aviso-legal">
          El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no
          inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la
          Ley N° 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la
          atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las
          normas vigentes en materia de protección de datos personales.
        </p>

        <h2>9. Almacenamiento local y cookies</h2>
        <p>
          Usamos el almacenamiento local del navegador solo para mantener la sesión iniciada. No usamos cookies de publicidad ni de seguimiento
          de terceros.
        </p>

        <h2>10. Menores de edad</h2>
        <p>El Servicio está dirigido a comercios y personas mayores de 18 años. No recolectamos a sabiendas datos de menores.</p>

        <h2>11. Cambios en esta Política</h2>
        <p>
          Podemos actualizar esta Política. Cada versión se identifica por su fecha; los cambios se informan por email y en el panel, donde el
          Cliente deberá aceptar la nueva versión para seguir usando su cuenta. Ver también los <Link to="/terminos">Términos y Condiciones</Link>.
        </p>
      </article>
    </PaginaSitio>
  );
}
