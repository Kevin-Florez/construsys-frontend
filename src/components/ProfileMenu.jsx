import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Avatar,
    Menu,
    MenuItem,
    Typography,
    Box,
    ListItemIcon,
    Divider,
    Tooltip,
    Button,
    Badge,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from '@mui/material';
import { 
    AccountCircle, 
    ExitToApp, 
    Settings, 
    ArrowDropDown,
    Info as InfoIcon
} from '@mui/icons-material';

const ProfileMenu = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleOpenConfirmLogout = () => {
        setConfirmLogoutOpen(true);
        handleClose();
    };
    const handleCloseConfirmLogout = () => setConfirmLogoutOpen(false);

    const handleLogout = () => {
        handleCloseConfirmLogout();
        logout();
    };
    
    const getInitials = (name) => {
        if (!name) return '?';
        const parts = name.split(' ');
        const first = parts[0] ? parts[0][0] : '';
        const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
        return `${first}${last}`.toUpperCase();
    };

    if (!user) return null;

    // ✨ CORRECCIÓN FINAL: Se lee 'user.nombre' que es la propiedad estandarizada en el AuthContext.
    const displayName = user.nombre || 'Usuario';
    const displayRole = user.rol?.nombre || 'Rol';
    const initials = getInitials(displayName);

    return (
        <>
            <Tooltip title="Mi Cuenta">
                <Button
                    onClick={handleMenu}
                    sx={{ p: '6px 8px', borderRadius: 2, textTransform: 'none', color: 'text.primary', '&:hover': { backgroundColor: 'action.hover' } }}
                    aria-controls="menu-appbar"
                    aria-haspopup="true"
                >
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                            <Box sx={{ bgcolor: '#f0f0f0', width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                                <ArrowDropDown fontSize="small" sx={{ color: 'text.secondary', height: 16, width: 16 }} />
                            </Box>
                        }
                    >
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main', color: 'white' }}>
                            {initials || <AccountCircle />}
                        </Avatar>
                    </Badge>
                    
                    <Box sx={{ 
                        display: { xs: 'none', md: 'flex' },
                        flexDirection: 'column', 
                        alignItems: 'flex-start',
                        ml: 1.5 
                    }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                            {displayName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                            {displayRole}
                        </Typography>
                    </Box>
                </Button>
            </Tooltip>
            
            <Menu
                id="menu-appbar" anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}
                PaperProps={{ elevation: 0, sx: { overflow: 'visible', filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))', mt: 1.5, minWidth: 180, '& .MuiAvatar-root': { width: 32, height: 32, ml: -0.5, mr: 1 }, '&:before': { content: '""', display: 'block', position: 'absolute', top: 0, right: 14, width: 10, height: 10, bgcolor: 'background.paper', transform: 'translateY(-50%) rotate(45deg)', zIndex: 0 } } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem component={Link} to="/perfil" onClick={handleClose}>
                    <ListItemIcon><Settings fontSize="small" /></ListItemIcon>
                    Mi Perfil
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleOpenConfirmLogout}>
                    <ListItemIcon><ExitToApp fontSize="small" sx={{ color: 'error.main' }}/></ListItemIcon>
                    <Typography color="error" variant="inherit">Cerrar Sesión</Typography>
                </MenuItem>
            </Menu>

            <Dialog
  open={confirmLogoutOpen}
  onClose={handleCloseConfirmLogout}
>
  <DialogTitle
    sx={{
      color: "#dc2626",               // text-red-600
      backgroundColor: "#fef2f2",     // bg-red-50
      borderBottom: "1px solid #fee2e2", // border-red-200
      display: "flex",
      alignItems: "center",
    }}
  >
    <InfoIcon sx={{ verticalAlign: "middle", mr: 1 }} />
    Confirmar Cierre de Sesión
  </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que quieres cerrar sesión?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseConfirmLogout}  sx={{textTransform: 'none'}}>Cancelar</Button>
                    <Button onClick={handleLogout} color="error" variant="contained" autoFocus sx={{textTransform: 'none'}}>
                        Cerrar Sesión
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default ProfileMenu;