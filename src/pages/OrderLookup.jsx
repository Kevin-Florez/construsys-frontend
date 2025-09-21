// src/pages/OrderLookup.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, Loader2, PackageSearch, Fingerprint } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from '../utils/formatters';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// El componente PedidoListModal no necesita cambios
function PedidoListModal({ pedidos, onClose, onVerDetalle }) {
    if (!pedidos || pedidos.length === 0) {
        return (
            <Dialog open={true} onOpenChange={onClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sin Resultados</DialogTitle>
                        <DialogDescription>
                            No se encontraron pedidos pendientes o en curso con este documento.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-center mt-4">
                        <Button onClick={onClose}>Cerrar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }
    const formatFechaCorta = (fechaISO) => new Date(fechaISO).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
    
    const getStatusText = (status) => {
        const statusMap = {
            'pendiente_pago_temporal': 'Pendiente de Pago (1h)',
            'en_verificacion': 'En Verificación',
            'pago_incompleto': 'Pago Incompleto',
            'confirmado': 'Confirmado',
            'en_camino': 'En Camino',
            'entregado': 'Entregado',
            'cancelado': 'Cancelado',
            'cancelado_por_inactividad': 'Cancelado por Inactividad',
        };
        return statusMap[status] || 'Desconocido';
    };

    const getStatusColor = (status) => {
        const colorMap = {
            'entregado': 'bg-green-100 text-green-700',
            'en_camino': 'bg-blue-100 text-blue-700',
            'confirmado': 'bg-purple-100 text-purple-700',
            'cancelado': 'bg-red-100 text-red-700',
            'cancelado_por_inactividad': 'bg-red-100 text-red-700',
            'pago_incompleto': 'bg-yellow-100 text-yellow-700',
        };
        return colorMap[status] || 'bg-orange-100 text-orange-700';
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tus Pedidos</DialogTitle>
                    <DialogDescription>
                        A continuación, se muestra una lista de todos tus pedidos asociados a este documento.
                    </DialogDescription>
                </DialogHeader>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">Número de Pedido</TableHead>
                            <TableHead className="text-center">Fecha</TableHead>
                            <TableHead className="text-center">Estado</TableHead>
                            <TableHead className="text-center">Total</TableHead>
                            <TableHead className="text-center">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pedidos.map((pedido) => (
                            <TableRow key={pedido.id}>
                                <TableCell align="center" className="font-medium">#PED-{String(pedido.id).padStart(4, '0')}</TableCell>
                                <TableCell align="center">{formatFechaCorta(pedido.fecha_creacion)}</TableCell>
                                <TableCell align="center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(pedido.estado)}`}>
                                        {getStatusText(pedido.estado)}
                                    </span>
                                </TableCell>
                                <TableCell align="center">{formatCurrency(pedido.total)}</TableCell>
                                <TableCell align="center">
                                    <Button onClick={() => onVerDetalle(pedido.token_seguimiento)} variant="outline" size="sm">Ver Detalle</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="text-center mt-4">
                    <Button onClick={onClose}>Cerrar</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}


export default function OrderLookup() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [formData, setFormData] = useState({
        tipo_documento: searchParams.get('tipo_documento') || 'CC',
        documento: searchParams.get('documento') || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pedidosEncontrados, setPedidosEncontrados] = useState(null);

    // ✅ Función centralizada para buscar pedidos
    const fetchPedidos = useCallback(async (params) => {
        setIsSubmitting(true);
        setPedidosEncontrados(null); // Limpia resultados anteriores
        try {
            const query = new URLSearchParams(params).toString();
            const response = await fetch(`${API_BASE_URL}/pedidos/consulta-documento/?${query}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Error al buscar los pedidos.');
            }
            
            setPedidosEncontrados(data); // Guarda los datos para mostrar el modal
            if (data.length === 0) {
                toast.info("No se encontraron pedidos asociados a este documento.");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    // ✅ useEffect para buscar solo si hay parámetros en la URL al cargar la página
    useEffect(() => {
        const tipoDocUrl = searchParams.get('tipo_documento');
        const docUrl = searchParams.get('documento');

        if (tipoDocUrl && docUrl) {
            fetchPedidos({ tipo_documento: tipoDocUrl, documento: docUrl });
        }
    }, [fetchPedidos]); // No agregues searchParams aquí para evitar re-ejecuciones

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'documento') {
            setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '') }));
        }
    };

    const handleSelectChange = (value) => {
        setFormData(prev => ({ ...prev, tipo_documento: value }));
    };

    // ✅ El submit ahora actualiza la URL y siempre llama a la función de búsqueda
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.documento || !formData.tipo_documento) {
            toast.error("Ambos campos son requeridos.");
            return;
        }
        // Actualiza la URL para que el botón "volver" funcione
        setSearchParams(formData); 
        // Llama directamente a la búsqueda para asegurar que se ejecute siempre
        fetchPedidos(formData);
    };

    return (
        <>
            <section className="bg-blue-900 text-white py-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <PackageSearch className="mx-auto h-12 w-12 text-blue-300 mb-4" />
                    <h1 className="text-4xl lg:text-5xl font-bold">Consulta tus Pedidos</h1>
                    <p className="mt-4 text-xl text-blue-200 max-w-3xl mx-auto">
                        Ingresa tu documento para ver el estado de tus compras.
                    </p>
                </div>
            </section>
            
            <div className="flex justify-center items-start py-16 bg-slate-50 px-4">
                <Card className="w-full max-w-lg shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Encuentra tu Pedido</CardTitle>
                        <CardDescription>
                            Ingresa el tipo y número de documento que usaste en la compra.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-2">
                                <Label htmlFor="documento">Tipo y Número de Documento</Label>
                                <div className="flex gap-2">
                                    <Select onValueChange={handleSelectChange} value={formData.tipo_documento}>
                                        <SelectTrigger className="w-1/3">
                                            <SelectValue placeholder="Tipo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CC">C.C.</SelectItem>
                                            <SelectItem value="CE">C.E.</SelectItem>
                                            <SelectItem value="NIT">NIT</SelectItem>
                                            <SelectItem value="PAS">Pasaporte</SelectItem>
                                            <SelectItem value="TI">T.I.</SelectItem>
                                            <SelectItem value="RC">R.C.</SelectItem>
                                            <SelectItem value="PPT">PPT</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="relative w-2/3">
                                        <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="documento"
                                            name="documento"
                                            value={formData.documento}
                                            onChange={handleInputChange}
                                            placeholder="Tu número de documento"
                                            className="pl-10"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                Buscar Pedidos
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            {pedidosEncontrados && (
                <PedidoListModal 
                    pedidos={pedidosEncontrados} 
                    onClose={() => setPedidosEncontrados(null)}
                    onVerDetalle={(token) => {
                        // ✅ Se revierte a la URL que te funciona (singular)
                        navigate(`/pedido/ver/${token}`);
                    }}
                />
            )}
        </>
    );
}