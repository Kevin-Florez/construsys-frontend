import { useState } from 'react';
import { Mail, MapPin, Phone, Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";

export default function Contacto() {
    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        asunto: '',
        mensaje: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    // ✨ INICIO DE LA MODIFICACIÓN ✨
    const handleChange = (e) => {
        const { name, value } = e.target;
        let processedValue = value;

        // Aplicamos validaciones en tiempo real según el campo
        switch (name) {
            case 'nombre':
                // Solo permite letras (mayúsculas, minúsculas, con tildes) y espacios
                processedValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                break;
            // Podrías añadir más casos aquí para otros campos si lo necesitas
            // ej: case 'telefono': processedValue = value.replace(/\D/g, ''); break;
            default:
                // Para los demás campos (email, asunto, mensaje), no filtramos nada
                processedValue = value;
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };
    // ✨ FIN DE LA MODIFICACIÓN ✨

    const validateForm = () => {
        const newErrors = {};
        if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "El correo electrónico no es válido.";
        if (!formData.asunto.trim()) newErrors.asunto = "El asunto es requerido.";
        if (!formData.mensaje.trim()) newErrors.mensaje = "El mensaje no puede estar vacío.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Por favor, corrige los errores en el formulario.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/contacto/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    // Aseguramos que los nombres coincidan con lo que espera el backend
                    nombre: formData.nombre,
                    email: formData.email,
                    asunto: formData.asunto,
                    mensaje: formData.mensaje
                })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Error en el servidor.");
            }
            
            toast.success("¡Mensaje enviado con éxito!", {
                description: "Gracias por contactarnos. Te responderemos pronto."
            });
            setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });

        } catch (error) {
            toast.error("No se pudo enviar el mensaje.", {
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <section className="bg-blue-900 text-white py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <Badge className="mb-4 bg-blue-600/20 text-blue-200 border-blue-400/30">Hablemos</Badge>
                    <h1 className="text-4xl lg:text-5xl font-bold">Ponte en Contacto</h1>
                    <p className="mt-4 text-xl text-blue-200 max-w-3xl mx-auto">
                        ¿Tienes una pregunta o quieres iniciar un proyecto? Nuestro equipo está listo para ayudarte.
                    </p>
                </div>
            </section>
            
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-16">
                        <Card className="border-slate-200 shadow-lg">
                            <CardContent className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                                    <h3 className="text-2xl font-bold text-slate-900">Envíanos un Mensaje</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="nombre">Nombre Completo</Label>
                                        {/* ✨ Añadimos el atributo 'name' */}
                                        <Input id="nombre" name="nombre" placeholder="Ej: Juan Pérez" value={formData.nombre} onChange={handleChange} />
                                        {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Correo Electrónico</Label>
                                        <Input id="email" name="email" type="email" placeholder="Ej: juan.perez@correo.com" value={formData.email} onChange={handleChange} />
                                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="asunto">Asunto</Label>
                                        <Input id="asunto" name="asunto" placeholder="Ej: Cotización de cemento" value={formData.asunto} onChange={handleChange} />
                                        {errors.asunto && <p className="text-red-500 text-sm mt-1">{errors.asunto}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="mensaje">Mensaje</Label>
                                        <Textarea id="mensaje" name="mensaje" placeholder="Escribe tu mensaje aquí..." rows={5} value={formData.mensaje} onChange={handleChange} />
                                        {errors.mensaje && <p className="text-red-500 text-sm mt-1">{errors.mensaje}</p>}
                                    </div>
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" size="lg" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            'Enviar Mensaje'
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

            {/* Información de Contacto */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Información de Contacto</h3>
                <p className="mt-2 text-slate-600">Encuéntranos en nuestra sede o contáctanos directamente a través de nuestros canales.</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">Nuestra Oficina</h4>
                    <p className="text-slate-600">Cll 63 #44-78, Itagüí, Antioquia</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-slate-100 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-lg">Correo Electrónico</h4>
                    <p className="text-slate-600">deposito.delsur@hotmail.com</p>
                  </div>
                </div>
                {/* Puedes añadir más contactos como teléfono aquí */}
              </div>
              <div className="h-80 w-full overflow-hidden rounded-lg shadow-lg mt-8">
                 <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.411135759902!2d-75.6083549258287!3d6.20901592656333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e468307ca758c3f%3A0x6a74b4528753239e!2sCl.%2063%20%2344-78%2C%20Itag%C3%BCi%2C%20Antioquia!5e0!3m2!1ses-419!2sco!4v1719166258418!5m2!1ses-419!2sco" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade">
                 </iframe>
              </div>

            </div>
            
          </div>
        </div>
      </section>
    </>
  );
}