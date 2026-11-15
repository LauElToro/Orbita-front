import { Link } from 'react-router-dom';
import { PaginaSitio } from '../components/Sitio';
import { fecha } from '../format';
import { EMPRESA, VERSION_LEGAL } from './empresa';

export function Terminos() {
  return (
    <PaginaSitio angosta>
      <article className="legal">
        <h1>Términos y Condiciones del Servicio</h1>
        <p className="muted">
          Versión {VERSION_LEGAL.terminos} · Vigente desde el {fecha(VERSION_LEGAL.terminos)}
        </p>

        <h2>1. Partes y aceptación</h2>
        <p>
          Estos Términos y Condiciones (los <strong>"Términos"</strong>) regulan el uso de la plataforma {EMPRESA.marca} (el{' '}
          <strong>"Servicio"</strong>), provista por {EMPRESA.razonSocial}, CUIT {EMPRESA.cuit}, con domicilio en {EMPRESA.domicilio} (
          <strong>"Orbita"</strong>), y la persona humana o jurídica que se registra o contrata un plan (el <strong>"Cliente"</strong>).
        </p>
        <p>
          Al marcar la casilla de aceptación, registrarse, pagar o usar el Servicio, el Cliente declara haber leído, entendido y aceptado estos
          Términos y la <Link to="/privacidad">Política de Privacidad</Link>. La aceptación electrónica tiene el mismo valor que una firma
          (arts. 284, 286 y 288 del Código Civil y Comercial de la Nación) y Orbita la registra con fecha, hora, versión aceptada, dirección IP
          y navegador. Quien se registra en nombre de un comercio declara ser mayor de 18 años y tener facultades suficientes para obligarlo.
          Si no está de acuerdo con estos Términos, no debe usar el Servicio.
        </p>

        <h2>2. Definiciones</h2>
        <ul>
          <li>
            <strong>Contactos:</strong> las personas que escriben al Cliente por WhatsApp, Instagram, TikTok u otros canales y que son
            atendidas por el asistente.
          </li>
          <li>
            <strong>Plataformas de terceros:</strong> Meta (WhatsApp e Instagram), TikTok, los proveedores de modelos de
            inteligencia artificial, Mercado Pago y cualquier otro servicio externo del que depende el Servicio.
          </li>
          <li>
            <strong>Contenido del Cliente:</strong> la información del negocio, los textos, precios, horarios, instrucciones y demás datos que
            el Cliente carga o que se generan con su configuración.
          </li>
        </ul>

        <h2>3. Qué es el Servicio</h2>
        <p>
          Orbita es una herramienta de software que genera respuestas automáticas mediante inteligencia artificial a partir del Contenido del
          Cliente y las entrega a través de las cuentas de WhatsApp, Instagram o TikTok que el Cliente conecta. Según el plan, puede además registrar turnos y enviar recordatorios.
        </p>
        <p>
          Orbita <strong>no es parte</strong> de las conversaciones ni de las relaciones comerciales entre el Cliente y sus Contactos: no vende,
          cobra, entrega ni garantiza los productos o servicios del Cliente, ni asume obligación alguna frente a los Contactos.
        </p>

        <h2>4. Requisitos y cuenta</h2>
        <p>
          Para usar el Servicio el Cliente necesita cuentas propias y activas en los canales que quiera conectar (por ejemplo, WhatsApp Business
          Platform, una cuenta profesional de Instagram o una cuenta Business de TikTok), cuyos costos, incluidos los cargos por mensaje que
          cobre Meta, y condiciones son ajenos a Orbita. El Cliente es responsable de la veracidad de los datos de registro, de la
          confidencialidad de su contraseña y de los tokens de acceso que cargue, y de toda actividad realizada desde su cuenta. Debe avisar de inmediato a
          Orbita ante cualquier uso no autorizado.
        </p>

        <h2>5. Respuestas generadas por inteligencia artificial</h2>
        <p>
          El Cliente entiende y acepta que las respuestas se generan de forma automática por modelos de inteligencia artificial y que, por su
          naturaleza, <strong>pueden ser incompletas, inexactas o inadecuadas</strong>, incluso cuando la configuración es correcta. En
          consecuencia:
        </p>
        <ul>
          <li>
            El Cliente es el único responsable de configurar, revisar y mantener actualizado el Contenido que usa el asistente (precios,
            stock, horarios, condiciones, políticas) y de supervisar su funcionamiento, para lo cual dispone del simulador y del panel.
          </li>
          <li>
            Las respuestas no constituyen asesoramiento profesional de ningún tipo (legal, médico, financiero, impositivo u otro) ni una oferta
            vinculante de Orbita.
          </li>
          <li>
            Los precios, promociones, disponibilidad, turnos o cualquier compromiso que el asistente comunique se consideran comunicaciones del
            Cliente, quien responde por ellos frente a sus Contactos. Orbita no responde por errores u omisiones del asistente ni por sus
            consecuencias.
          </li>
          <li>
            Cuando la normativa o las políticas de las Plataformas de terceros lo exijan, el Cliente debe informar a sus Contactos que están
            siendo atendidos por un sistema automatizado y ofrecerles la posibilidad de hablar con una persona.
          </li>
        </ul>

        <h2>6. Uso aceptable</h2>
        <p>El Cliente se obliga a no usar el Servicio para:</p>
        <ul>
          <li>enviar mensajes no solicitados, spam o comunicaciones masivas que violen las políticas de las Plataformas de terceros;</li>
          <li>
            ofrecer productos o servicios ilegales, o regulados sin las habilitaciones correspondientes (por ejemplo, medicamentos, armas,
            apuestas o servicios financieros);
          </li>
          <li>recolectar datos sensibles (salud, origen étnico, opiniones políticas, religión, vida sexual) o datos de menores de edad;</li>
          <li>engañar, discriminar, acosar o suplantar la identidad de terceros;</li>
          <li>infringir derechos de propiedad intelectual, de consumidores o de protección de datos;</li>
          <li>intentar vulnerar, sobrecargar, copiar o hacer ingeniería inversa del Servicio.</li>
        </ul>
        <p>
          El Cliente debe cumplir en todo momento las condiciones y políticas de Meta (incluidas las políticas de WhatsApp Business)
          y TikTok. Ante un incumplimiento o un riesgo para el Servicio, Orbita puede suspender el Servicio de inmediato y sin previo aviso,
          sin que ello genere derecho a reintegro ni indemnización.
        </p>

        <h2>7. Planes, topes y pagos</h2>
        <ul>
          <li>
            El Servicio se contrata por abono mensual que se paga por adelantado. Cada plan incluye una cantidad máxima de respuestas por día,
            semana y mes; al alcanzarse, el asistente deja de responder con IA y envía un mensaje fijo hasta que el período se renueva o se
            cambia de plan.
          </li>
          <li>
            Los pagos se realizan por débito automático de Mercado Pago. Orbita no almacena datos de tarjetas; el procesamiento lo realiza
            Mercado Pago bajo sus propios términos. Podés crear la cuenta y recorrer el panel antes de pagar; el asistente se habilita cuando
            el pago se acredita.
          </li>
          <li>
            Si el pago no se acredita, el Servicio se pausa automáticamente una vez vencido el período de gracia informado en el panel, sin
            necesidad de aviso previo, y se reanuda cuando se acredita el pago.
          </li>
          <li>
            Orbita puede actualizar los precios notificando al Cliente con al menos 30 días de anticipación. Si el Cliente no está de acuerdo,
            puede dar de baja el Servicio antes de que rija el nuevo precio.
          </li>
          <li>
            Salvo el derecho de revocación previsto en el punto 8, los importes abonados no son reembolsables, incluso por períodos usados
            parcialmente, por topes no consumidos o por suspensiones derivadas de incumplimientos del Cliente o de Plataformas de terceros.
          </li>
        </ul>

        <h2>8. Derecho de revocación (botón de arrepentimiento)</h2>
        <p>
          Cuando el Cliente revista el carácter de consumidor en los términos de la Ley 24.240, puede revocar la contratación dentro de los 10
          días corridos contados desde la contratación, sin costo ni responsabilidad alguna, a través del{' '}
          <Link to="/arrepentimiento">botón de arrepentimiento</Link> (art. 34 de la Ley 24.240 y Resolución 424/2020 de la Secretaría de
          Comercio Interior). Orbita confirmará la recepción con un código de trámite y reintegrará lo abonado por el mismo medio de pago.
        </p>

        <h2>9. Baja</h2>
        <p>
          El Cliente puede dar de baja el Servicio en cualquier momento desde su panel o escribiendo a {EMPRESA.soporte}. La baja tiene efecto
          al finalizar el período ya abonado y cancela los débitos futuros. Una vez dada de baja la cuenta, Orbita puede eliminar el Contenido
          del Cliente y las conversaciones luego de 90 días, salvo los datos que deba conservar por obligación legal.
        </p>

        <h2>10. Plan Personalizado</h2>
        <p>
          Las soluciones a medida se rigen además por la propuesta aceptada por el Cliente, que define alcance, integraciones y abono. Lo no
          previsto en la propuesta se rige por estos Términos. Los cambios de alcance se cotizan por separado.
        </p>

        <h2>11. Disponibilidad y Plataformas de terceros</h2>
        <p>
          Orbita realiza esfuerzos razonables para mantener el Servicio disponible, pero <strong>no garantiza</strong> que funcione de manera
          ininterrumpida, sin demoras o libre de errores. Puede haber interrupciones por mantenimiento, actualizaciones o causas de fuerza mayor.
        </p>
        <p>
          El Servicio depende de Plataformas de terceros que Orbita no controla. Orbita no responde por sus caídas, demoras, cambios de
          funcionalidades, precios o políticas, ni por suspensiones, bloqueos o sanciones que esas plataformas apliquen a las cuentas del
          Cliente, cualquiera sea su causa.
        </p>

        <h2>12. Propiedad intelectual</h2>
        <p>
          El software, la marca, el diseño y la documentación de Orbita son de su exclusiva propiedad o de sus licenciantes. El Cliente recibe
          una licencia de uso limitada, no exclusiva, intransferible y revocable mientras su plan esté vigente. El Cliente conserva la
          titularidad del Contenido del Cliente y otorga a Orbita una licencia no exclusiva y gratuita para usarlo con el único fin de prestar,
          mantener y mejorar el Servicio. Orbita puede usar las sugerencias que el Cliente le envíe sin obligación alguna.
        </p>

        <h2>13. Datos personales</h2>
        <p>
          Respecto de los datos de los Contactos, el Cliente es el <strong>responsable de la base de datos</strong> y Orbita actúa como{' '}
          <strong>encargado del tratamiento</strong> por cuenta del Cliente (art. 25 de la Ley 25.326), tratándolos solo para prestar el Servicio.
          El Cliente garantiza que cuenta con base legal y, cuando corresponda, con el consentimiento de sus Contactos, que les informa sobre el
          uso de un asistente automatizado y que atiende sus pedidos de acceso, rectificación y supresión. El tratamiento de los datos del propio
          Cliente se rige por la <Link to="/privacidad">Política de Privacidad</Link>.
        </p>

        <h2>14. Confidencialidad</h2>
        <p>
          Cada parte se obliga a mantener en reserva la información confidencial de la otra a la que acceda con motivo del Servicio, y a usarla
          solo para cumplir estos Términos, durante su vigencia y por 2 años posteriores.
        </p>

        <h2>15. Limitación de responsabilidad</h2>
        <p>
          El Servicio se presta <strong>"tal como está" y "según disponibilidad"</strong>. En la máxima medida permitida por la ley aplicable:
        </p>
        <ul>
          <li>
            Orbita no será responsable por lucro cesante, pérdida de ventas, clientes, datos, oportunidades de negocio o reputación, ni por daños
            indirectos, incidentales, punitivos o consecuenciales.
          </li>
          <li>
            La responsabilidad total de Orbita por cualquier reclamo vinculado con el Servicio no superará el importe efectivamente abonado por el
            Cliente durante los 3 meses anteriores al hecho que originó el reclamo.
          </li>
        </ul>
        <p>
          Estas limitaciones no se aplican a los daños causados por dolo o culpa grave de Orbita ni restringen los derechos irrenunciables que la
          Ley 24.240 reconoce al Cliente cuando sea consumidor.
        </p>

        <h2>16. Indemnidad</h2>
        <p>
          El Cliente mantendrá indemne a Orbita, sus socios, empleados y proveedores frente a cualquier reclamo, sanción, daño o gasto (incluidos
          honorarios razonables de abogados) que se origine en el Contenido del Cliente, en las respuestas enviadas a sus Contactos, en su
          relación con ellos, o en el incumplimiento de estos Términos, de la normativa aplicable o de las políticas de Plataformas de terceros.
        </p>

        <h2>17. Suspensión y terminación</h2>
        <p>
          Orbita puede suspender o dar por terminado el Servicio ante falta de pago, incumplimiento de estos Términos, uso que ponga en riesgo el
          Servicio o a terceros, o requerimiento de autoridad competente. Fuera de esos casos, Orbita puede discontinuar el Servicio avisando con
          30 días de anticipación y reintegrando la parte proporcional no usada del período abonado.
        </p>

        <h2>18. Modificaciones</h2>
        <p>
          Orbita puede modificar estos Términos. Cada versión queda identificada por su fecha. Las modificaciones se informan por email y en el
          panel, y el Cliente deberá aceptar la nueva versión para seguir usando su cuenta. Si no la acepta, puede dar de baja el Servicio en las
          condiciones del punto 9.
        </p>

        <h2>19. Comunicaciones</h2>
        <p>
          Las notificaciones se envían al email registrado por el Cliente, que se compromete a mantenerlo actualizado, y se consideran recibidas
          al momento de su envío. El Cliente puede comunicarse con Orbita en {EMPRESA.soporte}.
        </p>

        <h2>20. Generales</h2>
        <p>
          Si alguna cláusula fuera declarada inválida, las demás seguirán vigentes. La falta de ejercicio de un derecho por parte de Orbita no
          implica renuncia. El Cliente no puede ceder su posición contractual sin autorización de Orbita.
        </p>

        <h2>21. Ley aplicable y jurisdicción</h2>
        <p>
          Estos Términos se rigen por las leyes de la República Argentina. Para cualquier controversia, las partes se someten a los tribunales
          ordinarios de la {EMPRESA.jurisdiccion}, con renuncia a cualquier otro fuero, salvo que el Cliente sea consumidor, en cuyo caso será
          competente el tribunal correspondiente a su domicilio (art. 36 de la Ley 24.240).
        </p>

        <p className="muted small">
          Consultas legales: <a href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a>
        </p>
      </article>
    </PaginaSitio>
  );
}
