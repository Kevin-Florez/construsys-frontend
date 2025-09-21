import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    IconButton, Tooltip, TablePagination,
    InputAdornment, CircularProgress, Typography, Box, Autocomplete, Grid, Divider, Chip,
    FormControl, InputLabel, Select, MenuItem,
    // --- INICIO DE CAMBIOS ---
    Switch // Se importa el componente Switch
    // --- FIN DE CAMBIOS ---
} from "@mui/material";
import {
    Visibility, Edit, Delete, Add as AddIcon, Save as SaveIcon, Cancel as CancelIcon,
    Search as SearchIcon, Clear as ClearIcon, Info as InfoIcon,
    AddCircleOutline, Inventory, PriceCheck,
    RemoveShoppingCart as DarDeBajaIcon
} from "@mui/icons-material";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';


import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import "../styles/Productos.css";

const API_BASE_URL = "https://construsys-despliegue-iaas.vercel.app/api";

const formatCurrency = (value) => {
    const number = parseFloat(value);
    if (isNaN(number)) return "$0";
    return `$${number.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};


const MOTIVO_BAJA_CHOICES = {
    'DANIO_INTERNO': 'Daño en almacén',
    'PERDIDA': 'Pérdida o hurto',
    'OTRO': 'Otro motivo'
};

const Productos = () => {
    const { authTokens, user } = useAuth();
    const canCreate = user?.privileges?.includes('productos_crear');
    const canEdit = user?.privileges?.includes('productos_editar');
    const canDelete = user?.privileges?.includes('productos_eliminar');

    // --- INICIO DE CAMBIOS ---
    // Se actualiza el nombre del privilegio
    const canDarDeBaja = user?.privileges?.includes('stock_registrar_baja');
    // --- FIN DE CAMBIOS --
    
    const [productos, setProductos] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    
    const [open, setOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [viewMode, setViewMode] = useState(false);
    const [selectedProducto, setSelectedProducto] = useState(null);

    const initialFormState = {
        nombre: "", marca: null, descripcion: "", peso: "", dimensiones: "", material: "",
        otros_detalles: "", imagen_url: "", imagenes_write: [''],
        ultimo_margen_aplicado: "0",
        stock_minimo: "10", stock_maximo: "100",
        activo: true, categoria: null,
    };
    const [form, setForm] = useState(initialFormState);

    const [marcaModalOpen, setMarcaModalOpen] = useState(false);
    const [newMarcaName, setNewMarcaName] = useState('');
    
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedForDeletion, setSelectedForDeletion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // --- INICIO DE CAMBIOS ---
    // Estados para el diálogo de confirmación de cambio de estado
    const [confirmStatusDialogOpen, setConfirmStatusDialogOpen] = useState(false);
    const [productoToToggle, setProductoToToggle] = useState(null);
    // --- FIN DE CAMBIOS ---



    // --- INICIO DE CAMBIOS ---
    // Nuevos estados para el modal de "Dar de Baja"
    const [bajaModalOpen, setBajaModalOpen] = useState(false);
    const [productoParaBaja, setProductoParaBaja] = useState(null);
    const [bajaFormData, setBajaFormData] = useState({ cantidad: 1, motivo: 'DANIO_INTERNO', descripcion: '' });
    // --- FIN DE CAMBIOS ---
    
    const fetchInitialData = useCallback(async () => {
        // ... (código sin cambios)
        const token = authTokens?.access;
        if (!token) return;
        setLoading(true);
        try {
            const [productosRes, categoriasRes, marcasRes] = await Promise.all([
                fetch(`${API_BASE_URL}/productos/`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/categorias/?activo=true`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/marcas/?activo=true`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            if (!productosRes.ok) throw new Error('Error al cargar productos');
            if (!categoriasRes.ok) throw new Error('Error al cargar categorías');
            if (!marcasRes.ok) throw new Error('Error al cargar marcas');
            
            const productosData = await productosRes.json();
            const categoriasData = await categoriasRes.json();
            const marcasData = await marcasRes.json();
            
            setProductos(Array.isArray(productosData) ? productosData : []);
            setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
            setMarcas(Array.isArray(marcasData) ? marcasData : []);
        } catch (err) {
            toast.error(err.message || "Error al cargar los datos iniciales.");
        } finally {
            setLoading(false);
        }
    }, [authTokens]);
    
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const filteredProductos = productos.filter(prod => {
  const term = searchTerm.toLowerCase();

  return (
    (prod.id?.toString().includes(term)) ||
    (prod.nombre?.toLowerCase().includes(term)) ||
    (prod.descripcion?.toLowerCase().includes(term)) ||
    (prod.otros_detalles?.toLowerCase().includes(term)) ||
    (prod.marca?.nombre?.toLowerCase().includes(term)) ||
    (prod.categoria?.nombre?.toLowerCase().includes(term)) ||
    (prod.material?.toLowerCase().includes(term)) ||
    (prod.dimensiones?.toLowerCase().includes(term)) ||
    (prod.peso?.toLowerCase().includes(term)) ||
    (prod.precio_venta?.toString().includes(term)) ||
    (prod.stock_actual?.toString().includes(term)) ||
    (prod.stock_minimo?.toString().includes(term)) ||
    (prod.stock_maximo?.toString().includes(term)) ||
    (prod.activo ? "activo" : "inactivo").includes(term)
  );
});


    const handleOpen = (producto = null, mode = "add") => {
        setViewMode(mode === "view");
        setEditMode(mode === "edit");
        setSelectedProducto(producto);
        if (producto) {
            setForm({
                nombre: producto.nombre || "", marca: producto.marca || null,
                descripcion: producto.descripcion || "", peso: producto.peso || "",
                dimensiones: producto.dimensiones || "", material: producto.material || "",
                otros_detalles: producto.otros_detalles || "", // <-- Ya estaba aquí, el problema era en el JSX
                imagen_url: producto.imagen_url || "",
                imagenes_write: producto.imagenes?.length > 0 ? producto.imagenes.map(img => img.imagen_url) : [''],
                ultimo_margen_aplicado: producto.ultimo_margen_aplicado || "0",
                stock_minimo: String(producto.stock_minimo ?? "10"),
                stock_maximo: String(producto.stock_maximo ?? "100"),
                activo: producto.activo !== undefined ? producto.activo : true,
                categoria: producto.categoria || null,
            });
        } else {
            setForm(initialFormState);
        }
        setOpen(true);
    };

    // ... (handleClose, handleChange, handleSave, etc., no necesitan cambios)
    const handleClose = () => setOpen(false);
    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleSave = async () => {
        if (!form.nombre || !form.marca || !form.categoria) {
            toast.error("Nombre, Marca y Categoría son campos obligatorios.");
            return;
        }
        setActionLoading(true);
        const token = authTokens?.access;
        const productoData = {
            ...form,
            marca_id: form.marca?.id || null, 
            categoria_id: form.categoria?.id || null,
            imagenes_write: form.imagenes_write.filter(url => url && url.trim() !== ''),
            stock_minimo: parseInt(form.stock_minimo, 10), 
            stock_maximo: parseInt(form.stock_maximo, 10),
            ultimo_margen_aplicado: parseFloat(form.ultimo_margen_aplicado)
        };
        delete productoData.marca;
        delete productoData.categoria;

        const url = editMode ? `${API_BASE_URL}/productos/${selectedProducto.id}/` : `${API_BASE_URL}/productos/`;
        const method = editMode ? "PUT" : "POST";

        try {
            const res = await fetch(url, { method, headers: { 'Content-Type': "application/json", 'Authorization': `Bearer ${token}` }, body: JSON.stringify(productoData) });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(Object.values(errorData).flat().join(' '));
            }
            toast.success(`Producto ${editMode ? "actualizado" : "agregado"} correctamente`);
            fetchInitialData();
            handleClose();
        } catch (err) {
            toast.error(err.message || "Error al guardar el producto.");
        } finally {
            setActionLoading(false);
        }
    };
    const calculatedSalePrice = useMemo(() => {
        if (!editMode && !viewMode) return 0;
        const cost = parseFloat(selectedProducto?.ultimo_costo_compra) || 0;
        const margin = parseFloat(form.ultimo_margen_aplicado) || 0;
        if (cost > 0 && margin >= 0) {
            return cost * (1 + (margin / 100));
        }
        return parseFloat(selectedProducto?.precio_venta) || 0;
    }, [form.ultimo_margen_aplicado, selectedProducto, editMode, viewMode]);
    const handleOpenMarcaModal = () => setMarcaModalOpen(true);
    const handleCloseMarcaModal = () => { setNewMarcaName(''); setMarcaModalOpen(false); };
    const handleCreateNewMarca = async () => {
        if (!newMarcaName.trim()) {
            toast.error("El nombre de la marca no puede estar vacío.");
            return;
        }
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/marcas/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` },
                body: JSON.stringify({ nombre: newMarcaName })
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.nombre?.[0] || 'No se pudo crear la marca.');
            }
            const nuevaMarca = await response.json();
            toast.success("Marca creada y seleccionada.");
            setMarcas(prev => [...prev, nuevaMarca].sort((a, b) => a.nombre.localeCompare(b.nombre)));
            setForm(prev => ({ ...prev, marca: nuevaMarca }));
            handleCloseMarcaModal();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };
    const handleDelete = (producto) => {
        setSelectedForDeletion(producto);
        setConfirmDialogOpen(true);
    };
    const confirmDelete = async () => {
        const token = authTokens?.access;
        if (!selectedForDeletion || !token) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/productos/${selectedForDeletion.id}/`, {
                method: "DELETE",
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok && res.status !== 204) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.detail || `Error al eliminar. Código: ${res.status}`);
            }
            toast.success("Producto eliminado correctamente");
            fetchInitialData();
        } catch (err) {
            toast.error(err.message || "Error al eliminar el producto.");
        } finally {
            setActionLoading(false);
            setConfirmDialogOpen(false);
            setSelectedForDeletion(null);
        }
    };

    // --- INICIO DE CAMBIOS ---
    // Funciones para manejar el cambio de estado
    const handleOpenStateConfirmDialog = (producto) => {
        if (!canEdit) {
            toast.error("No tienes permiso para editar productos.");
            return;
        }
        setProductoToToggle(producto);
        setConfirmStatusDialogOpen(true);
    };

    const handleConfirmToggleState = async () => {
        if (!productoToToggle) return;
        
        const token = authTokens?.access;
        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/productos/${productoToToggle.id}/`, {
                method: "PATCH",
                headers: { 'Content-Type': "application/json", 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ activo: !productoToToggle.activo })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Error al cambiar el estado");
            }
            toast.success("Estado del producto actualizado.");
            fetchInitialData(); // Recarga los datos para reflejar el cambio
        } catch (err) {
            toast.error("Error al cambiar el estado del producto.");
        } finally {
            setActionLoading(false);
            setConfirmStatusDialogOpen(false);
            setProductoToToggle(null);
        }
    };
    // --- FIN DE CAMBIOS ---

    const handleImageChange = (index, value) => {
        const newImages = [...form.imagenes_write];
        newImages[index] = value;
        setForm(prev => ({ ...prev, imagenes_write: newImages }));
    };
    const addImageField = () => {
        setForm(prev => ({ ...prev, imagenes_write: [...prev.imagenes_write, ''] }));
    };
    const removeImageField = (index) => {
        if (form.imagenes_write.length <= 1) {
            setForm(prev => ({...prev, imagenes_write: ['']}));
            return;
        }
        const newImages = form.imagenes_write.filter((_, i) => i !== index);
        setForm(prev => ({ ...prev, imagenes_write: newImages }));
    };
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };


    // --- INICIO DE CAMBIOS ---
    // Funciones para manejar el modal de dar de baja
    const handleOpenBajaModal = (producto) => {
        setProductoParaBaja(producto);
        setBajaFormData({ cantidad: 1, motivo: 'DANIO_INTERNO', descripcion: '' });
        setBajaModalOpen(true);
    };

    const handleCloseBajaModal = () => {
        setBajaModalOpen(false);
        setProductoParaBaja(null);
    };

    const handleConfirmarBaja = async () => {
        if (!bajaFormData.descripcion.trim() || bajaFormData.cantidad <= 0) {
            toast.error("La cantidad debe ser mayor a cero y la descripción es obligatoria.");
            return;
        }
        if (bajaFormData.cantidad > productoParaBaja.stock_actual) {
            toast.error(`La cantidad no puede ser mayor al stock actual (${productoParaBaja.stock_actual}).`);
            return;
        }

        setActionLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/productos/${productoParaBaja.id}/dar-de-baja/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authTokens.access}` },
                body: JSON.stringify(bajaFormData),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(Object.values(errData).flat().join(' ') || "Error al registrar la baja.");
            }
            toast.success("Baja registrada y stock actualizado.");
            fetchInitialData(); // Recargar datos
            handleCloseBajaModal();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setActionLoading(false);
        }
    };


    if (loading) {
        return <div className="loading-indicator"><CircularProgress /></div>;
    }

    return (
        <div className="productos-container">
            {/* ... (Título y barra de búsqueda sin cambios) ... */}
            <div className="productos-title-header"><h1>Gestión de Productos</h1></div>
            <Box className="productos-toolbar">
                <TextField placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} variant="outlined" size="small"
                    InputProps={{
                        startAdornment: (<InputAdornment position="start"><SearchIcon className="search-icon" /></InputAdornment>),
                        endAdornment: searchTerm && (<IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon fontSize="small" /></IconButton>),
                    }}
                    sx={{ minWidth: '400px', backgroundColor: 'white' }} />
                {canCreate && (
                    <Button sx={{textTransform: 'none'}} className="add-button" variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpen(null)}>
                        Agregar Producto
                    </Button>
                )}
            </Box>
            
            <TableContainer component={Paper} className="productos-table" variant="outlined">
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">Nombre</TableCell>
                            <TableCell align="center">Marca</TableCell>
                            <TableCell align="center">Categoría</TableCell>
                            <TableCell align="center">Precio Venta</TableCell>
                            <TableCell align="center">Stock</TableCell>
                            <TableCell align="center">Estado</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredProductos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((prod) => (
                            <TableRow key={prod.id} className={!prod.activo ? "row-inactivo" : ""} hover>
                                <TableCell align="center">{prod.nombre}</TableCell>
                                <TableCell align="center">{prod.marca?.nombre || 'N/A'}</TableCell>
                                <TableCell align="center">{prod.categoria?.nombre || 'N/A'}</TableCell>
                                <TableCell align="center" sx={{fontWeight: 'bold'}}>{formatCurrency(prod.precio_venta)}</TableCell>
                                <TableCell align="center">{prod.stock_actual}</TableCell>
                                <TableCell align="center">
                                    {/* --- INICIO DE CAMBIOS --- */}
                                    {/* Se añade el Switch para cambiar estado */}
                                    <Tooltip 
  title={canEdit ? (prod.activo ? "Click para desactivar" : "Click para activar") : "Sin permisos"}
>
  <span
    className={`estado-label ${prod.activo ? "activo" : "inactivo"} ${canEdit ? "estado-clickable" : ""}`}
    onClick={canEdit ? () => handleOpenStateConfirmDialog(prod) : undefined}
  >
    {prod.activo ? "Activo" : "Inactivo"}
  </span>
</Tooltip>


                                    {/* --- FIN DE CAMBIOS --- */}
                                </TableCell>
                                <TableCell align="center" className="actions-cell">
                                    <Box display="flex" justifyContent="center">
                                        <Tooltip title="Ver detalles"><IconButton color="info" onClick={() => handleOpen(prod, "view")} size="small"><Visibility /></IconButton></Tooltip>
                                        <Tooltip title="Editar"><span><IconButton color="primary" onClick={() => handleOpen(prod, "edit")} size="small" disabled={!canEdit}><Edit /></IconButton></span></Tooltip>
                                        <Tooltip title="Dar de Baja">
  <span>
    <IconButton
  color="warning"
  onClick={() => handleOpenBajaModal(prod)}
  disabled={!canDarDeBaja || !prod.activo}
>
  <RemoveCircleOutlineIcon />
</IconButton>

  </span>
</Tooltip>

                                        <Tooltip title="Eliminar"><span><IconButton color="error" onClick={() => handleDelete(prod)} disabled={!canDelete}><Delete /></IconButton></span></Tooltip>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredProductos.length}
                                    rowsPerPage={rowsPerPage} page={page} onPageChange={(event, newPage) => setPage(newPage)} 
                                    onRowsPerPageChange={(event) => { setRowsPerPage(parseInt(event.target.value, 10)); setPage(0); }}
                                    labelRowsPerPage="Filas por página:"
                                />
            </TableContainer>

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth className="producto-dialog">
                <DialogTitle className="dialog-title">
                    <InfoIcon sx={{verticalAlign:'middle', mr:1}}/>
                    {viewMode ? "Detalles del Producto" : editMode ? "Editar Producto" : "Crear Nuevo Producto"}
                </DialogTitle>
                <DialogContent dividers className="dialog-content">
                    <Grid container spacing={3} sx={{ pt: 1 }}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Información Básica</Typography>
                            <TextField fullWidth label="Nombre de producto" name="nombre" value={form.nombre} onChange={handleChange} disabled={viewMode} margin="dense" required />
                            <Autocomplete sx={{ mt: 2 }} fullWidth options={marcas} getOptionLabel={(option) => option.nombre || ""} value={form.marca} onChange={(event, newValue) => setForm(prev => ({ ...prev, marca: newValue }))} isOptionEqualToValue={(option, value) => option.id === value?.id} renderInput={(params) => <TextField {...params} label="Marca" required />} disabled={viewMode} />
                            {!viewMode && (<Button onClick={handleOpenMarcaModal} size="small" sx={{mt: 1, textTransform: 'none'}} startIcon={<AddIcon />}>Crear nueva marca</Button>)}
                            <Autocomplete sx={{ mt: 2 }} fullWidth options={categorias} getOptionLabel={(option) => option.nombre} value={form.categoria} onChange={(event, newValue) => setForm(prev => ({ ...prev, categoria: newValue }))} isOptionEqualToValue={(option, value) => option.id === value?.id} renderInput={(params) => (<TextField {...params} label="Categoría" required />)} disabled={viewMode} />
                            <TextField sx={{ mt: 2 }} multiline rows={4} fullWidth label="Descripción" name="descripcion" value={form.descripcion} onChange={handleChange} disabled={viewMode} margin="dense" />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                            <Typography variant="h6" gutterBottom>Especificaciones e Imágenes</Typography>
                            <TextField fullWidth label="Peso" name="peso" value={form.peso} onChange={handleChange} disabled={viewMode} margin="dense" />
                            <TextField fullWidth label="Dimensiones" name="dimensiones" value={form.dimensiones} onChange={handleChange} disabled={viewMode} margin="dense" />
                            <TextField fullWidth label="Material" name="material" value={form.material} onChange={handleChange} disabled={viewMode} margin="dense" />
                            {/* --- INICIO DE CAMBIOS --- */}
                            {/* Se reincorpora el campo "Otros Detalles" */}
                            <TextField multiline rows={4} fullWidth label="Otros Detalles" name="otros_detalles" value={form.otros_detalles} onChange={handleChange} disabled={viewMode} margin="dense" sx={{ mt: 2 }}/>
                            {/* --- FIN DE CAMBIOS --- */}
                            <TextField fullWidth label="URL de la Imagen Principal" name="imagen_url" value={form.imagen_url} onChange={handleChange} disabled={viewMode} margin="dense" sx={{ mt: 2 }}/>
                        </Grid>

                        {/* ... (Secciones de Inventario y Precios sin cambios) ... */}
                        <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Gestión de Inventario" icon={<Inventory />} /></Divider></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth label="Stock Actual" value={selectedProducto?.stock_actual ?? "0"} disabled margin="dense" variant="filled" /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Stock Mínimo" name="stock_minimo" value={form.stock_minimo} onChange={handleChange} disabled={viewMode} margin="dense" /></Grid>
                        <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Stock Máximo" name="stock_maximo" value={form.stock_maximo} onChange={handleChange} disabled={viewMode} margin="dense" /></Grid>

                        {(editMode || viewMode) && (
                            <>
                                <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Precios" icon={<PriceCheck />} /></Divider></Grid>
                                <Grid item xs={12} sm={4}><TextField fullWidth label="Último Costo Compra" value={formatCurrency(selectedProducto?.ultimo_costo_compra)} disabled margin="dense" variant="filled" /></Grid>
                                <Grid item xs={12} sm={4}><TextField fullWidth type="number" label="Margen de Ganancia (%)" name="ultimo_margen_aplicado" value={form.ultimo_margen_aplicado} onChange={handleChange} disabled={viewMode || !selectedProducto?.ultimo_costo_compra > 0} margin="dense" InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} helperText={!selectedProducto?.ultimo_costo_compra > 0 ? "El producto no tiene costo." : ""} /></Grid>
                                <Grid item xs={12} sm={4}><TextField fullWidth label="Precio de Venta (Calculado)" value={formatCurrency(calculatedSalePrice)} disabled margin="dense" variant="filled" /></Grid>
                            </>
                        )}

                        <Grid item xs={12}><Divider sx={{ my: 2 }}><Chip label="Imágenes Adicionales" /></Divider></Grid>
                        <Grid item xs={12}>
                            <Box>
                                <Typography variant="subtitle1" gutterBottom>URLs de Imágenes Adicionales</Typography>
                                {form.imagenes_write.map((url, index) => (
                                    <Box key={index} display="flex" alignItems="center" mb={1}><TextField fullWidth label={`Imagen Adicional ${index + 1}`} value={url} onChange={(e) => handleImageChange(index, e.target.value)} disabled={viewMode} variant="outlined" size="small" />{!viewMode && (<IconButton onClick={() => removeImageField(index)} color="error" disabled={form.imagenes_write.length <= 1}><Delete /></IconButton>)}</Box>
                                ))}
                                {!viewMode && (<Button startIcon={<AddCircleOutline />} onClick={addImageField} sx={{ mt: 1, textTransform: 'none' }}>Añadir URL</Button>)}
                            </Box>
                        </Grid>

                    </Grid>
                </DialogContent>
                <DialogActions className="dialog-actions">
                    <Button onClick={handleClose} sx={{ textTransform: 'none' }} color="inherit" variant="outlined" startIcon={<CancelIcon />}>{viewMode ? "Cerrar" : "Cancelar"}</Button>
                    {!viewMode && (<Button onClick={handleSave} sx={{ textTransform: 'none' }} variant="contained" color="primary" startIcon={<SaveIcon />} disabled={actionLoading}>{actionLoading ? <CircularProgress size={24} color="inherit"/> : (editMode ? "Actualizar" : "Guardar")}</Button>)}
                </DialogActions>
            </Dialog>

            <Dialog open={bajaModalOpen} onClose={handleCloseBajaModal} maxWidth="sm" fullWidth className="cliente-dialog">
                <DialogTitle className="dialog-title">
                    <InfoIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Dar de Baja: {productoParaBaja?.nombre}
                </DialogTitle>
                <DialogContent>
                    <Typography gutterBottom>Stock actual: <strong>{productoParaBaja?.stock_actual}</strong></Typography>
                    <TextField
                        autoFocus margin="dense" label="Cantidad a dar de baja" type="number"
                        fullWidth variant="outlined"
                        value={bajaFormData.cantidad}
                        onChange={(e) => setBajaFormData(prev => ({ ...prev, cantidad: parseInt(e.target.value) || 1 }))}
                        inputProps={{ min: 1, max: productoParaBaja?.stock_actual }}
                        required
                    />
                    {/* --- INICIO DE CAMBIOS --- */}
                    <FormControl fullWidth margin="normal" required>
                        <InputLabel>Motivo de la Baja</InputLabel>
                        <Select
                            value={bajaFormData.motivo}
                            label="Motivo de la Baja"
                            onChange={(e) => setBajaFormData(prev => ({ ...prev, motivo: e.target.value }))}
                        >
                            {Object.entries(MOTIVO_BAJA_CHOICES).map(([key, value]) => (
                                <MenuItem key={key} value={key}>{value}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    {/* --- FIN DE CAMBIOS --- */}
                    <TextField
                        margin="dense" label="Descripción detallada"
                        fullWidth multiline rows={3}
                        value={bajaFormData.descripcion}
                        onChange={(e) => setBajaFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                        required
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseBajaModal} disabled={actionLoading} sx={{textTransform: 'none'}}>Cancelar</Button>
                    <Button onClick={handleConfirmarBaja} variant="contained" sx={{textTransform: 'none'}} color="primary" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : 'Confirmar Baja'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- INICIO DE CAMBIOS --- */}
            {/* Se añade el diálogo de confirmación para el cambio de estado */}
            <Dialog open={confirmStatusDialogOpen} onClose={() => setConfirmStatusDialogOpen(false)} className="confirm-estado">
                <DialogTitle><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Confirmar Cambio de Estado</DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas {productoToToggle?.activo ? 'desactivar' : 'activar'} el producto "<strong>{productoToToggle?.nombre}</strong>"?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmStatusDialogOpen(false)} color="inherit" variant="outlined" disabled={actionLoading} sx={{textTransform:'none'}}>Cancelar</Button>
                    <Button onClick={handleConfirmToggleState} color="success" sx={{textTransform:'none'}} variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : 'Confirmar'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* --- FIN DE CAMBIOS --- */}


            {/* ... (Diálogos de marca y eliminación sin cambios) ... */}
            <Dialog open={marcaModalOpen} onClose={handleCloseMarcaModal} maxWidth="xs" fullWidth className="marca-dialog">
                <DialogTitle className="dialog-marca"><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }} />Crear Nueva Marca</DialogTitle>
                <DialogContent><TextField autoFocus margin="dense" label="Nombre de la Nueva Marca" type="text" fullWidth variant="outlined" value={newMarcaName} onChange={(e) => setNewMarcaName(e.target.value)} disabled={actionLoading} /></DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseMarcaModal} disabled={actionLoading} sx={{textTransform:'none'}}>Cancelar</Button>
                    <Button onClick={handleCreateNewMarca} sx={{textTransform:'none'}} variant="contained" disabled={actionLoading}>{actionLoading ? <CircularProgress size={24} /> : 'Crear'}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} className="confirm-dialog">
                <DialogTitle className="confirm-dialog-title"><InfoIcon style={{ verticalAlign: "middle", marginRight: 10 }}  />Confirmar Eliminación</DialogTitle>
                <DialogContent><Typography>¿Estás seguro de que deseas eliminar "<strong>{selectedForDeletion?.nombre}</strong>"?</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)} sx={{textTransform:'none'}}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" sx={{textTransform:'none'}}>Eliminar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Productos;