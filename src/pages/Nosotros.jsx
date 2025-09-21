import { Building, Target, Zap, Users, Shield, Heart } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Nosotros() {
  const values = [
    { icon: Shield, title: "Calidad", description: "Ofrecemos solo productos que cumplen con los más altos estándares de la industria." },
    { icon: Heart, title: "Compromiso", description: "La satisfacción de nuestros clientes es el pilar de nuestro negocio." },
    { icon: Zap, title: "Eficiencia", description: "Procesos optimizados para garantizar entregas rápidas y un servicio ágil." },
    { icon: Users, title: "Confianza", description: "Construimos relaciones duraderas basadas en la honestidad y la transparencia." },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-blue-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge className="mb-4 bg-blue-600/20 text-blue-200 border-blue-400/30">
            Nuestra Esencia
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold">Sobre Depósito y Ferretería del Sur</h1>
          <p className="mt-4 text-xl text-blue-200 max-w-3xl mx-auto">
            Más que un proveedor, somos tu socio estratégico en cada etapa de la construcción, comprometidos con el éxito de tus proyectos desde 2005.
          </p>
        </div>
      </section>

      {/* Mision y Vision */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-orange-500 text-white p-3 rounded-full">
                  <Building className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Nuestra Misión</h2>
              </div>
              <p className="text-lg text-slate-600">
                Facilitar el acceso a materiales de construcción de la más alta calidad, brindando un servicio de asesoramiento experto y una logística eficiente que impulsen el desarrollo y la materialización de los proyectos de nuestros clientes.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 text-white p-3 rounded-full">
                  <Target className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Nuestra Visión</h2>
              </div>
              <p className="text-lg text-slate-600">
                Ser el depósito de materiales de construcción líder y de mayor confianza en el Valle de Aburrá, reconocidos por nuestra innovación, nuestro compromiso con la sostenibilidad y por ser el aliado fundamental en el crecimiento de la industria constructora.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Nuestros Valores</h2>
            <p className="mt-4 text-xl text-slate-600">Los principios que guían cada una de nuestras acciones.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value) => (
              <Card key={value.title} className="text-center border-0 shadow-md">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <value.icon className="h-8 w-8 text-slate-700" />
                  </div>
                  <CardTitle>{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}