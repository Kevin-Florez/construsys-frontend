// src/pages/home.jsx (MODIFICADO PARA USAR EL LAYOUT PÚBLICO)

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Shield,
  Truck,
  Users,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Hammer,
  Package,
} from "lucide-react"
import { Link } from "react-router-dom"

export default function Home() {
  const features = [
    {
      icon: Shield,
      title: "Calidad Garantizada",
      description: "Seleccionamos los mejores materiales para asegurar la durabilidad y seguridad de tus obras.",
    },
    {
      icon: Package,
      title: "Amplia Variedad",
      description: "Todo lo que necesitas, desde agregados hasta acabados, en un solo lugar.",
    },
    {
      icon: Users,
      title: "Asesoramiento Experto",
      description: "Nuestro equipo está listo para ayudarte a encontrar la solución perfecta para tu proyecto.",
    },
    {
      icon: Truck,
      title: "Entrega Rápida",
      description: "Servicio de entrega eficiente para que no pares tu obra por falta de materiales.",
    },
  ]

  const categories = [
    {
      title: "Cementos y Morteros",
      description: "Bases sólidas para construcciones duraderas",
      icon: Building2,
      href: "/catalogo",
    },
    {
      title: "Aceros y Mallas",
      description: "Refuerzo estructural de alta resistencia",
      icon: Shield,
      href: "/catalogo",
    },
    {
      title: "Ladrillos y Bloques",
      description: "Elementos constructivos de primera calidad",
      icon: Package,
      href: "/catalogo",
    },
    {
      title: "Herramientas",
      description: "Equipamiento profesional para cada trabajo",
      icon: Hammer,
      href: "/catalogo",
    },
  ]

  const stats = [
  { icon: Shield,  label: "Años de Experiencia",   value: "+20" },
  { icon: Users,   label: "Clientes Satisfechos",  value: "5.000" },
  { icon: Package, label: "Productos Disponibles", value: "+500" },
  { icon: Phone,   label: "Atención al Cliente",   value: "24/7" }
];

  // ✨ NOTA: Se ha eliminado el <nav> y <footer> de este archivo.
  // Ahora son proporcionados por el componente PublicLayout.jsx para ser reutilizados.
  // Este componente solo contiene las secciones de contenido de la página de inicio.
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1200')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <Badge className="mb-4 bg-blue-600/20 text-blue-200 border-blue-400/30">
                Líder en Materiales de Construcción
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Cimientos Sólidos para{" "}
                <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                  Tus Proyectos
                </span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Calidad, variedad y el mejor servicio en materiales de construcción para llevar tus ideas al siguiente
                nivel.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
                  <Link to="/catalogo-publico" className="flex items-center">
                    Explorar Catálogo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-orange-600/20 rounded-3xl blur-3xl"></div>
              <Card className="relative bg-white/10 backdrop-blur-md border-white/20">
                <CardContent className="p-8">
  <div className="grid grid-cols-2 gap-6">
    {stats.map((stat, index) => {
      const Icon = stat.icon;
      return (
        <div key={index} className="text-center">
          <div className="mb-2">
            <Icon className="h-8 w-8 text-white mx-auto" />
          </div>

          {/* Aquí va el valor */}
          <div className="text-2xl font-semibold text-white">
            {stat.value}
          </div>

          {/* Label original */}
          <div className="text-blue-200 text-sm">
            {stat.label}
          </div>
        </div>
      );
    })}
  </div>
</CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="
    mb-4 
    bg-blue-100 
    text-blue-800 
    hover:text-white      /* pone el texto en blanco */
    hover:bg-blue-500   /* opcional: cambia el fondo al hacer hover */
    transition-colors     /* transición suave */
  "
>¿Por Qué Elegirnos?</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              La Mejor Experiencia en Materiales de Construcción
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Nos comprometemos a brindarte productos de calidad superior y un servicio excepcional
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-2"
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge
  className="
    mb-4 
    bg-orange-100 
    text-orange-800 
    hover:text-white      /* pone el texto en blanco */
    hover:bg-orange-500   /* opcional: cambia el fondo al hacer hover */
    transition-colors     /* transición suave */
  "
>
  Nuestros Productos
</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">Categorías Destacadas</h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Encuentra todo lo que necesitas para tu proyecto de construcción
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden"
              >
                <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group-hover:from-blue-50 group-hover:to-blue-100 transition-all duration-300">
                  <category.icon className="h-16 w-16 text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300" />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{category.title}</h3>
                  <p className="text-slate-600 mb-4">{category.description}</p>
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300"
                  >
                    <Link to="/catalogo-publico" className="flex-grow text-center">
                      Ver Más
                      <ArrowRight className="ml-2 h-4 w-4 inline-block" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1200')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">¿Listo para Empezar tu Próximo Proyecto?</h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Visita nuestro depósito o contáctanos para una cotización personalizada. Nuestro equipo de expertos está
            aquí para ayudarte.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
              <Link to="/contacto" className="flex items-center">
                Contáctanos Ahora
                <Phone className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}