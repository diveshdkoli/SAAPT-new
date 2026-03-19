// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   View, Text, FlatList, TextInput, TouchableOpacity,
//   StyleSheet, StatusBar, ActivityIndicator, Alert,
//   RefreshControl, Modal, ScrollView, KeyboardAvoidingView, Platform,
// } from 'react-native';
// import {
//   collection, getDocs, addDoc, deleteDoc, doc,
//   query, orderBy, serverTimestamp, writeBatch,
// } from 'firebase/firestore';
// import { db } from '../../services/firebase/config';

// const COLORS = {
//   primary:'#4F46E5', primaryLight:'#EEF2FF',
//   secondary:'#06B6D4', secondaryLight:'#ECFEFF',
//   success:'#10B981', successLight:'#D1FAE5',
//   danger:'#EF4444', dangerLight:'#FEF2F2',
//   warning:'#F59E0B', warningLight:'#FEF3C7',
//   purple:'#8B5CF6', purpleLight:'#F5F3FF',
//   background:'#F8F9FE', card:'#FFFFFF',
//   text:'#1E1B4B', textSecondary:'#6B7280', textLight:'#9CA3AF',
//   border:'#E5E7EB', inputBg:'#F3F4F6', shadow:'#1E1B4B',
//   overlay:'rgba(30,27,75,0.55)',
// };

// const CLASS_COLORS = ['#4F46E5','#06B6D4','#10B981','#F59E0B','#8B5CF6','#EC4899','#EF4444','#14B8A6'];
// const getClassColor = (id='') => CLASS_COLORS[id.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % CLASS_COLORS.length];
// const getInitials = (name='') => { const w=name.trim().split(/[\s\-]+/); return w.length>=2?`${w[0][0]}${w[1][0]}`.toUpperCase():name.substring(0,2).toUpperCase()||'CL'; };
// const formatDate = (ts) => { if(!ts) return ''; try { const d=ts.toDate?ts.toDate():new Date(ts); return d.toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}); } catch{return '';} };

// const SCREEN_TABS   = [{key:'classes',label:'Classes',icon:'🏫'},{key:'subjects',label:'Subjects',icon:'📚'}];
// const CLASS_FILTERS = [{key:'all',label:'All',icon:'🏫'},{key:'assigned',label:'Assigned',icon:'✅'},{key:'unassigned',label:'Unassigned',icon:'⚠️'}];

// // ─── Generic Picker Item ──────────────────────────────────────────────────────
// const PickerItem = ({item,selected,onPress,icon,multiSelect}) => (
//   <TouchableOpacity style={[pS.item,selected&&pS.itemSel]} onPress={()=>onPress(item)} activeOpacity={0.75}>
//     <View style={[pS.av,{backgroundColor:selected?COLORS.primary:COLORS.inputBg}]}><Text style={pS.avIcon}>{icon}</Text></View>
//     <View style={pS.info}>
//       <Text style={[pS.name,selected&&pS.nameSel]} numberOfLines={1}>{item.name}</Text>
//       {!!item.email&&<Text style={pS.sub} numberOfLines={1}>{item.email}</Text>}
//       {!!item.sub&&<Text style={pS.sub} numberOfLines={1}>{item.sub}</Text>}
//     </View>
//     {multiSelect
//       ? <View style={[pS.cb,selected&&pS.cbOn]}>{selected&&<Text style={pS.cbTick}>✓</Text>}</View>
//       : selected&&<Text style={pS.ck}>✓</Text>}
//   </TouchableOpacity>
// );
// const pS = StyleSheet.create({
//   item:{flexDirection:'row',alignItems:'center',padding:12,borderRadius:14,marginBottom:8,backgroundColor:COLORS.inputBg,borderWidth:1.5,borderColor:'transparent'},
//   itemSel:{backgroundColor:COLORS.primaryLight,borderColor:COLORS.primary},
//   av:{width:38,height:38,borderRadius:11,alignItems:'center',justifyContent:'center',marginRight:12},
//   avIcon:{fontSize:18},
//   info:{flex:1},
//   name:{fontSize:14,fontWeight:'600',color:COLORS.text},
//   nameSel:{color:COLORS.primary},
//   sub:{fontSize:12,color:COLORS.textSecondary,marginTop:1},
//   cb:{width:22,height:22,borderRadius:7,borderWidth:2,borderColor:COLORS.border,alignItems:'center',justifyContent:'center'},
//   cbOn:{backgroundColor:COLORS.secondary,borderColor:COLORS.secondary},
//   cbTick:{color:'#fff',fontSize:12,fontWeight:'800'},
//   ck:{fontSize:16,color:COLORS.primary,fontWeight:'700'},
// });

// // ─── Step Indicator ───────────────────────────────────────────────────────────
// const Steps = ({active}) => (
//   <View style={mS.stepRow}>
//     {['🏫 Class','📚 Subject','🔗 Assign'].map((s,i)=>(
//       <View key={i} style={mS.stepItem}>
//         <View style={[mS.stepDot,i<=active&&mS.stepDotActive,i<active&&mS.stepDotDone]}>
//           <Text style={mS.stepNum}>{i<active?'✓':i+1}</Text>
//         </View>
//         <Text style={[mS.stepLbl,i<=active&&mS.stepLblActive]}>{s}</Text>
//         {i<2&&<View style={[mS.stepLine,i<active&&mS.stepLineDone]}/>}
//       </View>
//     ))}
//   </View>
// );

// // ─── Modal shared styles ──────────────────────────────────────────────────────
// const mS = StyleSheet.create({
//   overlay:{flex:1,backgroundColor:COLORS.overlay,justifyContent:'flex-end'},
//   kv:{justifyContent:'flex-end'},
//   sheet:{backgroundColor:COLORS.card,borderTopLeftRadius:28,borderTopRightRadius:28,paddingHorizontal:20,paddingTop:12,maxHeight:'93%'},
//   handle:{width:40,height:4,backgroundColor:COLORS.border,borderRadius:2,alignSelf:'center',marginBottom:16},
//   hdrRow:{flexDirection:'row',alignItems:'center',marginBottom:14,gap:12},
//   hdrIcon:{width:44,height:44,borderRadius:14,backgroundColor:COLORS.primaryLight,alignItems:'center',justifyContent:'center'},
//   hdrIconTxt:{fontSize:22},
//   title:{fontSize:19,fontWeight:'800',color:COLORS.text,letterSpacing:-0.3},
//   subtitle:{fontSize:12,color:COLORS.textSecondary,marginTop:1},
//   closeBtn:{width:32,height:32,borderRadius:10,backgroundColor:COLORS.inputBg,alignItems:'center',justifyContent:'center'},
//   closeTxt:{fontSize:13,color:COLORS.textSecondary,fontWeight:'700'},
//   stepRow:{flexDirection:'row',alignItems:'center',marginBottom:20},
//   stepItem:{flexDirection:'row',alignItems:'center',flex:1},
//   stepDot:{width:24,height:24,borderRadius:12,backgroundColor:COLORS.border,alignItems:'center',justifyContent:'center'},
//   stepDotActive:{backgroundColor:COLORS.primary},
//   stepDotDone:{backgroundColor:COLORS.success},
//   stepNum:{color:'#fff',fontSize:11,fontWeight:'800'},
//   stepLine:{flex:1,height:2,backgroundColor:COLORS.border,marginHorizontal:4},
//   stepLineDone:{backgroundColor:COLORS.success},
//   stepLbl:{fontSize:9,color:COLORS.textLight,fontWeight:'500',position:'absolute',top:26,left:0,width:60},
//   stepLblActive:{color:COLORS.primary},
//   innerTabRow:{flexDirection:'row',gap:10,marginBottom:14},
//   innerTab:{flex:1,paddingVertical:10,borderRadius:12,alignItems:'center',backgroundColor:COLORS.inputBg,borderWidth:1.5,borderColor:COLORS.border},
//   innerTabOn:{backgroundColor:COLORS.primaryLight,borderColor:COLORS.primary},
//   innerTabTxt:{fontSize:13,fontWeight:'600',color:COLORS.textSecondary},
//   innerTabTxtOn:{color:COLORS.primary},
//   fGroup:{marginBottom:16},
//   lbl:{fontSize:14,fontWeight:'600',color:COLORS.text,marginBottom:8},
//   req:{color:COLORS.danger},
//   opt:{color:COLORS.textLight,fontWeight:'400',fontSize:12},
//   inRow:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.inputBg,borderRadius:14,paddingHorizontal:14,borderWidth:1.5,borderColor:COLORS.border},
//   inIcon:{fontSize:15,marginRight:10},
//   input:{flex:1,fontSize:15,color:COLORS.text,paddingVertical:13},
//   searchBox:{backgroundColor:COLORS.inputBg,borderRadius:12,paddingHorizontal:14,paddingVertical:10,fontSize:14,color:COLORS.text,marginBottom:10,borderWidth:1,borderColor:COLORS.border},
//   emptyP:{textAlign:'center',color:COLORS.textLight,fontSize:14,paddingVertical:16},
//   chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},
//   chip:{backgroundColor:COLORS.secondaryLight,borderRadius:20,paddingHorizontal:12,paddingVertical:5},
//   chipTxt:{fontSize:12,color:COLORS.secondary,fontWeight:'600'},
//   purpleChip:{backgroundColor:COLORS.purpleLight},
//   purpleChipTxt:{color:COLORS.purple},
//   preview:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.purpleLight,borderRadius:14,padding:14,marginBottom:16,gap:12,borderWidth:1.5,borderColor:'rgba(139,92,246,0.25)'},
//   previewIcon:{fontSize:28},
//   previewTitle:{fontSize:15,fontWeight:'700',color:COLORS.text},
//   previewSub:{fontSize:13,color:COLORS.textSecondary,marginTop:2},
//   summary:{backgroundColor:COLORS.inputBg,borderRadius:14,padding:14,marginBottom:18,borderWidth:1,borderColor:COLORS.border},
//   summaryTitle:{fontSize:13,fontWeight:'700',color:COLORS.text,marginBottom:10},
//   summaryRow:{flexDirection:'row',alignItems:'center',gap:8,marginBottom:6},
//   summaryIcon:{fontSize:14},
//   summaryTxt:{fontSize:13,color:COLORS.text,fontWeight:'600',flex:1},
//   summaryTeacher:{fontSize:12,color:COLORS.textSecondary},
//   summaryDiv:{height:1,backgroundColor:COLORS.border,marginVertical:8},
//   saveBtn:{borderRadius:16,paddingVertical:15,alignItems:'center',marginTop:8,shadowOffset:{width:0,height:4},shadowOpacity:0.28,shadowRadius:10,elevation:6},
//   saveBtnOff:{opacity:0.65},
//   saveBtnTxt:{color:'#fff',fontSize:16,fontWeight:'700',letterSpacing:0.3},
//   // Action sheet
//   aSheet:{backgroundColor:COLORS.card,borderTopLeftRadius:28,borderTopRightRadius:28,paddingHorizontal:20,paddingTop:14},
//   aTitle:{fontSize:18,fontWeight:'800',color:COLORS.text,marginBottom:4},
//   aSub:{fontSize:13,color:COLORS.textSecondary,marginBottom:20},
//   aItem:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.inputBg,borderRadius:16,padding:14,marginBottom:12,borderLeftWidth:4,gap:12},
//   aItemIcon:{width:44,height:44,borderRadius:14,alignItems:'center',justifyContent:'center'},
//   aItemIconTxt:{fontSize:22},
//   aItemLbl:{fontSize:15,fontWeight:'700'},
//   aItemSub:{fontSize:12,color:COLORS.textSecondary,marginTop:2},
//   aItemArrow:{fontSize:22,fontWeight:'300'},
// });

// // ─── ACTION SHEET ─────────────────────────────────────────────────────────────
// const ActionSheet = ({visible,onClose,onSelect}) => (
//   <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
//     <TouchableOpacity style={mS.overlay} activeOpacity={1} onPress={onClose}>
//       <View style={mS.aSheet}>
//         <View style={mS.handle}/>
//         <Text style={mS.aTitle}>What would you like to do?</Text>
//         <Text style={mS.aSub}>Choose an action to perform</Text>
//         {[
//           {key:'class',  icon:'🏫',label:'Create New Class',   sub:'Add a class and enroll students',      color:COLORS.primary, bg:COLORS.primaryLight},
//           {key:'subject',icon:'📚',label:'Create New Subject', sub:'Add a subject and assign a teacher',   color:COLORS.purple,  bg:COLORS.purpleLight},
//           {key:'assign', icon:'🔗',label:'Assign Subject to Class',sub:'Link subjects to an existing class',color:COLORS.success,bg:COLORS.successLight},
//         ].map((a)=>(
//           <TouchableOpacity key={a.key} style={[mS.aItem,{borderLeftColor:a.color}]}
//             onPress={()=>{onClose(); setTimeout(()=>onSelect(a.key),300);}} activeOpacity={0.8}>
//             <View style={[mS.aItemIcon,{backgroundColor:a.bg}]}><Text style={mS.aItemIconTxt}>{a.icon}</Text></View>
//             <View style={{flex:1}}>
//               <Text style={[mS.aItemLbl,{color:a.color}]}>{a.label}</Text>
//               <Text style={mS.aItemSub}>{a.sub}</Text>
//             </View>
//             <Text style={[mS.aItemArrow,{color:a.color}]}>›</Text>
//           </TouchableOpacity>
//         ))}
//         <View style={{height:24}}/>
//       </View>
//     </TouchableOpacity>
//   </Modal>
// );

// // ─── CREATE CLASS MODAL ───────────────────────────────────────────────────────
// const CreateClassModal = ({visible,onClose,onSave,students}) => {
//   const [name,setSel]=useState('');
//   const [selStudents,setSelStudents]=useState([]);
//   const [search,setSearch]=useState('');
//   const [saving,setSaving]=useState(false);
//   const reset=()=>{setSel('');setSelStudents([]);setSearch('');setSaving(false);};
//   const handleClose=()=>{reset();onClose();};
//   const toggle=(s)=>setSelStudents(p=>p.find(x=>x.id===s.id)?p.filter(x=>x.id!==s.id):[...p,s]);
//   const handleSave=async()=>{
//     if(!name.trim()){Alert.alert('Required','Please enter a class name.');return;}
//     setSaving(true);
//     await onSave({name:name.trim(),students:selStudents.map(s=>s.id)});
//     reset();
//   };
//   const filtered=students.filter(s=>(s.name||'').toLowerCase().includes(search.toLowerCase()));
//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
//       <View style={mS.overlay}>
//         <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={mS.kv}>
//           <View style={mS.sheet}>
//             <View style={mS.handle}/>
//             <View style={mS.hdrRow}>
//               <View style={mS.hdrIcon}><Text style={mS.hdrIconTxt}>🏫</Text></View>
//               <View style={{flex:1}}>
//                 <Text style={mS.title}>Create New Class</Text>
//                 <Text style={mS.subtitle}>Step 1 of 3 — Class details</Text>
//               </View>
//               <TouchableOpacity style={mS.closeBtn} onPress={handleClose}><Text style={mS.closeTxt}>✕</Text></TouchableOpacity>
//             </View>
//             <Steps active={0}/>
//             <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
//               <View style={mS.fGroup}>
//                 <Text style={mS.lbl}>Class Name <Text style={mS.req}>*</Text></Text>
//                 <View style={mS.inRow}>
//                   <Text style={mS.inIcon}>🏫</Text>
//                   <TextInput style={mS.input} placeholder="e.g. Grade 10 - A" placeholderTextColor={COLORS.textLight}
//                     value={name} onChangeText={setSel} autoCapitalize="words"/>
//                 </View>
//               </View>
//               <Text style={mS.lbl}>Enroll Students <Text style={mS.opt}>(optional)</Text></Text>
//               <TextInput style={mS.searchBox} placeholder="Search student..." placeholderTextColor={COLORS.textLight}
//                 value={search} onChangeText={setSearch}/>
//               {selStudents.length>0&&(
//                 <View style={mS.chips}>
//                   {selStudents.map(s=>(
//                     <TouchableOpacity key={s.id} style={mS.chip} onPress={()=>toggle(s)}>
//                       <Text style={mS.chipTxt}>{s.name}  ✕</Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>
//               )}
//               {filtered.map(s=>(
//                 <PickerItem key={s.id} item={s} icon="🎓"
//                   selected={!!selStudents.find(x=>x.id===s.id)} onPress={toggle} multiSelect/>
//               ))}
//               {filtered.length===0&&<Text style={mS.emptyP}>No students found</Text>}
//               <TouchableOpacity style={[mS.saveBtn,{backgroundColor:COLORS.primary,shadowColor:COLORS.primary},saving&&mS.saveBtnOff]}
//                 onPress={handleSave} disabled={saving} activeOpacity={0.85}>
//                 {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={mS.saveBtnTxt}>Create Class  →</Text>}
//               </TouchableOpacity>
//               <View style={{height:32}}/>
//             </ScrollView>
//           </View>
//         </KeyboardAvoidingView>
//       </View>
//     </Modal>
//   );
// };

// // ─── CREATE SUBJECT MODAL ─────────────────────────────────────────────────────
// const CreateSubjectModal = ({visible,onClose,onSave,teachers}) => {
//   const [subName,setSubName]=useState('');
//   const [selTeacher,setSelTeacher]=useState(null);
//   const [search,setSearch]=useState('');
//   const [saving,setSaving]=useState(false);
//   const reset=()=>{setSubName('');setSelTeacher(null);setSearch('');setSaving(false);};
//   const handleClose=()=>{reset();onClose();};
//   const handleSave=async()=>{
//     if(!subName.trim()){Alert.alert('Required','Please enter a subject name.');return;}
//     if(!selTeacher){Alert.alert('Required','Please assign a teacher.');return;}
//     setSaving(true);
//     await onSave({name:subName.trim(),teacherId:selTeacher.id,teacherName:selTeacher.name});
//     reset();
//   };
//   const filtered=teachers.filter(t=>(t.name||'').toLowerCase().includes(search.toLowerCase()));
//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
//       <View style={mS.overlay}>
//         <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={mS.kv}>
//           <View style={mS.sheet}>
//             <View style={mS.handle}/>
//             <View style={mS.hdrRow}>
//               <View style={[mS.hdrIcon,{backgroundColor:COLORS.purpleLight}]}><Text style={mS.hdrIconTxt}>📚</Text></View>
//               <View style={{flex:1}}>
//                 <Text style={mS.title}>Create Subject</Text>
//                 <Text style={mS.subtitle}>Step 2 of 3 — Assign teacher</Text>
//               </View>
//               <TouchableOpacity style={mS.closeBtn} onPress={handleClose}><Text style={mS.closeTxt}>✕</Text></TouchableOpacity>
//             </View>
//             <Steps active={1}/>
//             <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
//               <View style={mS.fGroup}>
//                 <Text style={mS.lbl}>Subject Name <Text style={mS.req}>*</Text></Text>
//                 <View style={mS.inRow}>
//                   <Text style={mS.inIcon}>📚</Text>
//                   <TextInput style={mS.input} placeholder="e.g. Mathematics, Physics" placeholderTextColor={COLORS.textLight}
//                     value={subName} onChangeText={setSubName} autoCapitalize="words"/>
//                 </View>
//               </View>
//               <Text style={mS.lbl}>Assign Teacher <Text style={mS.req}>*</Text></Text>
//               <TextInput style={mS.searchBox} placeholder="Search teacher..." placeholderTextColor={COLORS.textLight}
//                 value={search} onChangeText={setSearch}/>
//               <TouchableOpacity style={[pS.item,!selTeacher&&pS.itemSel]} onPress={()=>setSelTeacher(null)} activeOpacity={0.75}>
//                 <View style={[pS.av,{backgroundColor:!selTeacher?COLORS.danger:COLORS.inputBg}]}><Text style={pS.avIcon}>🚫</Text></View>
//                 <View style={pS.info}><Text style={[pS.name,!selTeacher&&{color:COLORS.danger}]}>No Teacher</Text></View>
//                 {!selTeacher&&<Text style={pS.ck}>✓</Text>}
//               </TouchableOpacity>
//               {filtered.map(t=>(
//                 <PickerItem key={t.id} item={t} icon="👩‍🏫"
//                   selected={selTeacher?.id===t.id} onPress={setSelTeacher} multiSelect={false}/>
//               ))}
//               {filtered.length===0&&<Text style={mS.emptyP}>No teachers found</Text>}
//               {subName.trim()!==''&&selTeacher&&(
//                 <View style={mS.preview}>
//                   <Text style={mS.previewIcon}>📚</Text>
//                   <View>
//                     <Text style={mS.previewTitle}>{subName}</Text>
//                     <Text style={mS.previewSub}>👩‍🏫 {selTeacher.name}</Text>
//                   </View>
//                 </View>
//               )}
//               <TouchableOpacity style={[mS.saveBtn,{backgroundColor:COLORS.purple,shadowColor:COLORS.purple},saving&&mS.saveBtnOff]}
//                 onPress={handleSave} disabled={saving} activeOpacity={0.85}>
//                 {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={mS.saveBtnTxt}>Create Subject  →</Text>}
//               </TouchableOpacity>
//               <View style={{height:32}}/>
//             </ScrollView>
//           </View>
//         </KeyboardAvoidingView>
//       </View>
//     </Modal>
//   );
// };

// // ─── ASSIGN SUBJECT → CLASS MODAL ────────────────────────────────────────────
// const AssignSubjectModal = ({visible,onClose,onSave,classes,subjects}) => {
//   const [selClass,setSelClass]=useState(null);
//   const [selSubjects,setSelSubjects]=useState([]);
//   const [classSearch,setClassSearch]=useState('');
//   const [subSearch,setSubSearch]=useState('');
//   const [innerTab,setInnerTab]=useState('class');
//   const [saving,setSaving]=useState(false);
//   const reset=()=>{setSelClass(null);setSelSubjects([]);setClassSearch('');setSubSearch('');setInnerTab('class');setSaving(false);};
//   const handleClose=()=>{reset();onClose();};
//   const toggleSub=(s)=>setSelSubjects(p=>p.find(x=>x.id===s.id)?p.filter(x=>x.id!==s.id):[...p,s]);
//   const handleSave=async()=>{
//     if(!selClass){Alert.alert('Required','Please select a class.');return;}
//     if(selSubjects.length===0){Alert.alert('Required','Please select at least one subject.');return;}
//     setSaving(true);
//     await onSave({classId:selClass.id,className:selClass.name,subjects:selSubjects});
//     reset();
//   };
//   const filteredC=classes.filter(c=>(c.name||'').toLowerCase().includes(classSearch.toLowerCase()));
//   const filteredS=subjects.filter(s=>(s.name||'').toLowerCase().includes(subSearch.toLowerCase()));
//   return (
//     <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
//       <View style={mS.overlay}>
//         <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={mS.kv}>
//           <View style={mS.sheet}>
//             <View style={mS.handle}/>
//             <View style={mS.hdrRow}>
//               <View style={[mS.hdrIcon,{backgroundColor:COLORS.successLight}]}><Text style={mS.hdrIconTxt}>🔗</Text></View>
//               <View style={{flex:1}}>
//                 <Text style={mS.title}>Assign Subject to Class</Text>
//                 <Text style={mS.subtitle}>Step 3 of 3 — Link subjects</Text>
//               </View>
//               <TouchableOpacity style={mS.closeBtn} onPress={handleClose}><Text style={mS.closeTxt}>✕</Text></TouchableOpacity>
//             </View>
//             <Steps active={2}/>
//             <View style={mS.innerTabRow}>
//               {[{key:'class',label:`🏫 Class${selClass?' ✓':''}`},{key:'subjects',label:`📚 Subjects (${selSubjects.length})`}].map(t=>(
//                 <TouchableOpacity key={t.key}
//                   style={[mS.innerTab,innerTab===t.key&&mS.innerTabOn]}
//                   onPress={()=>setInnerTab(t.key)}>
//                   <Text style={[mS.innerTabTxt,innerTab===t.key&&mS.innerTabTxtOn]}>{t.label}</Text>
//                 </TouchableOpacity>
//               ))}
//             </View>
//             <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
//               {innerTab==='class'?(
//                 <>
//                   <TextInput style={mS.searchBox} placeholder="Search class..." placeholderTextColor={COLORS.textLight}
//                     value={classSearch} onChangeText={setClassSearch}/>
//                   {filteredC.map(c=>(
//                     <PickerItem key={c.id} item={{...c,sub:`🎓 ${c.students?.length??0} students`}} icon="🏫"
//                       selected={selClass?.id===c.id} onPress={setSelClass} multiSelect={false}/>
//                   ))}
//                   {filteredC.length===0&&<Text style={mS.emptyP}>No classes found</Text>}
//                 </>
//               ):(
//                 <>
//                   <TextInput style={mS.searchBox} placeholder="Search subject..." placeholderTextColor={COLORS.textLight}
//                     value={subSearch} onChangeText={setSubSearch}/>
//                   {selSubjects.length>0&&(
//                     <View style={mS.chips}>
//                       {selSubjects.map(s=>(
//                         <TouchableOpacity key={s.id} style={[mS.chip,mS.purpleChip]} onPress={()=>toggleSub(s)}>
//                           <Text style={[mS.chipTxt,mS.purpleChipTxt]}>{s.name}  ✕</Text>
//                         </TouchableOpacity>
//                       ))}
//                     </View>
//                   )}
//                   {filteredS.map(s=>(
//                     <PickerItem key={s.id} item={{...s,sub:`👩‍🏫 ${s.teacherName||'No teacher'}`}} icon="📚"
//                       selected={!!selSubjects.find(x=>x.id===s.id)} onPress={toggleSub} multiSelect/>
//                   ))}
//                   {filteredS.length===0&&<Text style={mS.emptyP}>No subjects found</Text>}
//                 </>
//               )}
//               {selClass&&selSubjects.length>0&&(
//                 <View style={mS.summary}>
//                   <Text style={mS.summaryTitle}>📋 Assignment Summary</Text>
//                   <View style={mS.summaryRow}><Text style={mS.summaryIcon}>🏫</Text><Text style={mS.summaryTxt}>{selClass.name}</Text></View>
//                   <View style={mS.summaryDiv}/>
//                   {selSubjects.map(s=>(
//                     <View key={s.id} style={mS.summaryRow}>
//                       <Text style={mS.summaryIcon}>📚</Text>
//                       <Text style={mS.summaryTxt}>{s.name}</Text>
//                       <Text style={mS.summaryTeacher}>👩‍🏫 {s.teacherName||'—'}</Text>
//                     </View>
//                   ))}
//                 </View>
//               )}
//               <TouchableOpacity style={[mS.saveBtn,{backgroundColor:COLORS.success,shadowColor:COLORS.success},saving&&mS.saveBtnOff]}
//                 onPress={handleSave} disabled={saving} activeOpacity={0.85}>
//                 {saving?<ActivityIndicator color="#fff" size="small"/>:<Text style={mS.saveBtnTxt}>✓  Assign Subjects</Text>}
//               </TouchableOpacity>
//               <View style={{height:32}}/>
//             </ScrollView>
//           </View>
//         </KeyboardAvoidingView>
//       </View>
//     </Modal>
//   );
// };

// // ─── CLASS CARD ───────────────────────────────────────────────────────────────
// const ClassCard = ({cls,subjectCount,onDelete,onView}) => {
//   const color=getClassColor(cls.id);
//   const students=cls.students?.length??0;
//   return (
//     <View style={s.classCard}>
//       <View style={[s.stripe,{backgroundColor:color}]}/>
//       <View style={s.cardBody}>
//         <View style={s.cardLeft}>
//           <View style={[s.av,{backgroundColor:color}]}><Text style={s.avTxt}>{getInitials(cls.name)}</Text></View>
//           <View style={s.info}>
//             <Text style={s.clsName} numberOfLines={1}>{cls.name}</Text>
//             <View style={s.infoRow}><Text style={s.infoIcon}>🎓</Text><Text style={s.infoTxt}>{students} {students===1?'Student':'Students'}</Text></View>
//             <View style={s.infoRow}>
//               <Text style={s.infoIcon}>📚</Text>
//               <Text style={s.infoTxt}>{subjectCount} {subjectCount===1?'Subject':'Subjects'}</Text>
//               {subjectCount===0&&<View style={s.wBadge}><Text style={s.wBadgeTxt}>No Subjects</Text></View>}
//             </View>
//             {!!formatDate(cls.createdAt)&&<View style={s.infoRow}><Text style={s.infoIcon}>📅</Text><Text style={[s.infoTxt,{color:COLORS.textLight}]}>{formatDate(cls.createdAt)}</Text></View>}
//           </View>
//         </View>
//         <View style={s.actions}>
//           <TouchableOpacity style={[s.actBtn,{backgroundColor:COLORS.primaryLight}]} onPress={()=>onView(cls)} activeOpacity={0.7}><Text style={s.actIcon}>👁️</Text></TouchableOpacity>
//           <TouchableOpacity style={[s.actBtn,{backgroundColor:COLORS.dangerLight}]}
//             onPress={()=>Alert.alert('Delete Class',`Delete "${cls.name}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>onDelete(cls.id)}])}
//             activeOpacity={0.7}><Text style={s.actIcon}>🗑️</Text></TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// };

// // ─── SUBJECT CARD ─────────────────────────────────────────────────────────────
// const SubjectCard = ({subject,classCount,onDelete}) => (
//   <View style={s.subCard}>
//     <View style={[s.subIconBox,{backgroundColor:COLORS.purpleLight}]}><Text style={s.subIcon}>📚</Text></View>
//     <View style={s.subInfo}>
//       <Text style={s.subName} numberOfLines={1}>{subject.name}</Text>
//       <View style={s.infoRow}><Text style={s.infoIcon}>👩‍🏫</Text><Text style={[s.infoTxt,!subject.teacherName&&{color:COLORS.warning}]}>{subject.teacherName||'No Teacher Assigned'}</Text></View>
//       <View style={s.infoRow}><Text style={s.infoIcon}>🏫</Text><Text style={s.infoTxt}>{classCount} {classCount===1?'Class':'Classes'}</Text></View>
//     </View>
//     <TouchableOpacity style={[s.actBtn,{backgroundColor:COLORS.dangerLight}]}
//       onPress={()=>Alert.alert('Delete Subject',`Delete "${subject.name}"?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>onDelete(subject.id)}])}
//       activeOpacity={0.7}><Text style={s.actIcon}>🗑️</Text></TouchableOpacity>
//   </View>
// );

// // ═══════════════════════════════════════════════════════════════════════════════
// //  MAIN SCREEN
// // ═══════════════════════════════════════════════════════════════════════════════
// const ClassesScreen = ({navigation}) => {
//   const [classes,setClasses]=useState([]);
//   const [subjects,setSubjects]=useState([]);
//   const [classSubjects,setClassSubjects]=useState([]);
//   const [teachers,setTeachers]=useState([]);
//   const [students,setStudents]=useState([]);
//   const [screenTab,setScreenTab]=useState('classes');
//   const [classFilter,setClassFilter]=useState('all');
//   const [searchQuery,setSearchQuery]=useState('');
//   const [filteredClasses,setFilteredClasses]=useState([]);
//   const [filteredSubjects,setFilteredSubjects]=useState([]);
//   const [loading,setLoading]=useState(true);
//   const [refreshing,setRefreshing]=useState(false);
//   const [actionSheet,setActionSheet]=useState(false);
//   const [classModal,setClassModal]=useState(false);
//   const [subjectModal,setSubjectModal]=useState(false);
//   const [assignModal,setAssignModal]=useState(false);

//   const fetchAll=async()=>{
//     try {
//       const [clSnap,subSnap,csSnap,uSnap]=await Promise.all([
//         getDocs(query(collection(db,'classes'),orderBy('createdAt','desc'))),
//         getDocs(query(collection(db,'subjects'),orderBy('createdAt','desc'))),
//         getDocs(collection(db,'class_subjects')),
//         getDocs(collection(db,'users')),
//       ]);
//       const allU=uSnap.docs.map(d=>({id:d.id,...d.data()}));
//       setClasses(clSnap.docs.map(d=>({id:d.id,...d.data()})));
//       setSubjects(subSnap.docs.map(d=>({id:d.id,...d.data()})));
//       setClassSubjects(csSnap.docs.map(d=>({id:d.id,...d.data()})));
//       setTeachers(allU.filter(u=>u.role==='teacher'));
//       setStudents(allU.filter(u=>u.role==='student'));
//     } catch(e){console.error('fetch',e);}
//     finally{setLoading(false);setRefreshing(false);}
//   };

//   useEffect(()=>{fetchAll();},[]);
//   const onRefresh=useCallback(()=>{setRefreshing(true);fetchAll();},[]);

//   useEffect(()=>{
//     let r=[...classes];
//     const q=searchQuery.toLowerCase().trim();
//     if(classFilter==='assigned')   r=r.filter(c=>classSubjects.some(cs=>cs.classId===c.id));
//     if(classFilter==='unassigned') r=r.filter(c=>!classSubjects.some(cs=>cs.classId===c.id));
//     if(q) r=r.filter(c=>(c.name||'').toLowerCase().includes(q));
//     setFilteredClasses(r);
//   },[classes,classFilter,searchQuery,classSubjects]);

//   useEffect(()=>{
//     const q=searchQuery.toLowerCase().trim();
//     setFilteredSubjects(q?subjects.filter(s=>(s.name||'').toLowerCase().includes(q)||(s.teacherName||'').toLowerCase().includes(q)):subjects);
//   },[subjects,searchQuery]);

//   const subjectCountForClass =(id)=>classSubjects.filter(cs=>cs.classId===id).length;
//   const classCountForSubject =(id)=>classSubjects.filter(cs=>cs.subjectId===id).length;
//   const getTabCount=(key)=>{
//     if(key==='all') return classes.length;
//     if(key==='assigned') return classes.filter(c=>classSubjects.some(cs=>cs.classId===c.id)).length;
//     if(key==='unassigned') return classes.filter(c=>!classSubjects.some(cs=>cs.classId===c.id)).length;
//     return 0;
//   };

//   const handleCreateClass=async({name,students:sIds})=>{
//     try{
//       const ref=await addDoc(collection(db,'classes'),{name,students:sIds,createdAt:serverTimestamp()});
//       setClasses(p=>[{id:ref.id,name,students:sIds,createdAt:new Date()},...p]);
//       setClassModal(false);
//       Alert.alert('✅ Success',`Class "${name}" created!`);
//     }catch{Alert.alert('Error','Failed to create class.');}
//   };

//   const handleCreateSubject=async({name,teacherId,teacherName})=>{
//     try{
//       const ref=await addDoc(collection(db,'subjects'),{name,teacherId,teacherName,createdAt:serverTimestamp()});
//       setSubjects(p=>[{id:ref.id,name,teacherId,teacherName,createdAt:new Date()},...p]);
//       setSubjectModal(false);
//       Alert.alert('✅ Success',`Subject "${name}" assigned to ${teacherName}!`);
//     }catch{Alert.alert('Error','Failed to create subject.');}
//   };

//   const handleAssignSubjects=async({classId,className,subjects:subs})=>{
//     try{
//       const batch=writeBatch(db);
//       const newEntries=[];
//       for(const sub of subs){
//         const exists=classSubjects.find(cs=>cs.classId===classId&&cs.subjectId===sub.id);
//         if(!exists){
//           const ref=doc(collection(db,'class_subjects'));
//           batch.set(ref,{classId,className,subjectId:sub.id,subjectName:sub.name,teacherId:sub.teacherId,teacherName:sub.teacherName,createdAt:serverTimestamp()});
//           newEntries.push({id:ref.id,classId,subjectId:sub.id,subjectName:sub.name,teacherName:sub.teacherName});
//         }
//       }
//       await batch.commit();
//       setClassSubjects(p=>[...p,...newEntries]);
//       setAssignModal(false);
//       Alert.alert('✅ Success',`${subs.length} subject(s) assigned to ${className}!`);
//     }catch{Alert.alert('Error','Failed to assign subjects.');}
//   };

//   const handleDeleteClass=async(id)=>{
//     try{
//       await deleteDoc(doc(db,'classes',id));
//       setClasses(p=>p.filter(c=>c.id!==id));
//       const rel=classSubjects.filter(cs=>cs.classId===id);
//       await Promise.all(rel.map(cs=>deleteDoc(doc(db,'class_subjects',cs.id))));
//       setClassSubjects(p=>p.filter(cs=>cs.classId!==id));
//     }catch{Alert.alert('Error','Failed to delete class.');}
//   };

//   const handleDeleteSubject=async(id)=>{
//     try{
//       await deleteDoc(doc(db,'subjects',id));
//       setSubjects(p=>p.filter(x=>x.id!==id));
//       const rel=classSubjects.filter(cs=>cs.subjectId===id);
//       await Promise.all(rel.map(cs=>deleteDoc(doc(db,'class_subjects',cs.id))));
//       setClassSubjects(p=>p.filter(cs=>cs.subjectId!==id));
//     }catch{Alert.alert('Error','Failed to delete subject.');}
//   };

//   const keyExtractor=item=>item.id;
//   const renderClass=({item})=>(<ClassCard cls={item} subjectCount={subjectCountForClass(item.id)} onDelete={handleDeleteClass} onView={c=>navigation?.navigate('ClassDetail',{classData:c})}/>);
//   const renderSubject=({item})=>(<SubjectCard subject={item} classCount={classCountForSubject(item.id)} onDelete={handleDeleteSubject}/>);

//   return (
//     <View style={s.container}>
//       <StatusBar barStyle="light-content" backgroundColor={COLORS.primary}/>

//       {/* Header */}
//       <View style={s.header}>
//         <View style={s.hdrTop}>
//           <View>
//             <Text style={s.hdrTitle}>Class Management</Text>
//             <Text style={s.hdrSub}>Classes · Subjects · Assignments</Text>
//           </View>
//           <TouchableOpacity style={s.hdrBtn} onPress={()=>setActionSheet(true)} activeOpacity={0.8}>
//             <Text style={s.hdrBtnTxt}>+ New</Text>
//           </TouchableOpacity>
//         </View>
//         <View style={s.statsStrip}>
//           {[{num:classes.length,label:'Classes'},{num:subjects.length,label:'Subjects'},{num:classSubjects.length,label:'Links'},{num:teachers.length,label:'Teachers'}].map((x,i,arr)=>(
//             <React.Fragment key={x.label}>
//               <View style={s.statPill}><Text style={s.statNum}>{x.num}</Text><Text style={s.statLbl}>{x.label}</Text></View>
//               {i<arr.length-1&&<View style={s.statDiv}/>}
//             </React.Fragment>
//           ))}
//         </View>
//       </View>

//       {/* Screen tabs */}
//       <View style={s.screenTabRow}>
//         {SCREEN_TABS.map(t=>(
//           <TouchableOpacity key={t.key} style={[s.screenTab,screenTab===t.key&&s.screenTabOn]}
//             onPress={()=>{setScreenTab(t.key);setSearchQuery('');}} activeOpacity={0.8}>
//             <Text style={[s.screenTabTxt,screenTab===t.key&&s.screenTabTxtOn]}>{t.icon}  {t.label}</Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       <View style={s.body}>
//         {/* Search */}
//         <View style={s.searchWrap}>
//           <View style={s.searchBar}>
//             <Text style={s.searchIcon}>🔍</Text>
//             <TextInput style={s.searchInput}
//               placeholder={screenTab==='classes'?'Search classes...':'Search subjects or teacher...'}
//               placeholderTextColor={COLORS.textLight} value={searchQuery}
//               onChangeText={setSearchQuery} autoCorrect={false} autoCapitalize="none"/>
//             {searchQuery.length>0&&(
//               <TouchableOpacity onPress={()=>setSearchQuery('')} hitSlop={{top:10,bottom:10,left:10,right:10}}>
//                 <Text style={s.clearIcon}>✕</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         {/* Class filter tabs */}
//         {screenTab==='classes'&&(
//           <View style={s.tabsRow}>
//             {CLASS_FILTERS.map(tab=>{
//               const isActive=classFilter===tab.key;
//               return (
//                 <TouchableOpacity key={tab.key} style={[s.tab,isActive&&s.tabOn]}
//                   onPress={()=>setClassFilter(tab.key)} activeOpacity={0.75}>
//                   <Text style={[s.tabLbl,isActive&&s.tabLblOn]}>{tab.icon}  {tab.label}</Text>
//                   <View style={[s.tabCnt,isActive&&s.tabCntOn]}>
//                     <Text style={[s.tabCntTxt,isActive&&s.tabCntTxtOn]}>{getTabCount(tab.key)}</Text>
//                   </View>
//                 </TouchableOpacity>
//               );
//             })}
//           </View>
//         )}

//         {/* Meta */}
//         {!loading&&(
//           <View style={s.meta}>
//             <Text style={s.metaTxt}>
//               {screenTab==='classes'?`${filteredClasses.length} ${filteredClasses.length===1?'class':'classes'} found`:`${filteredSubjects.length} ${filteredSubjects.length===1?'subject':'subjects'} found`}
//             </Text>
//           </View>
//         )}

//         {/* List */}
//         {loading?(
//           <View style={s.loader}><ActivityIndicator size="large" color={COLORS.primary}/><Text style={s.loaderTxt}>Loading...</Text></View>
//         ):screenTab==='classes'?(
//           <FlatList data={filteredClasses} keyExtractor={keyExtractor} renderItem={renderClass}
//             contentContainerStyle={[s.list,filteredClasses.length===0&&s.listEmpty]}
//             showsVerticalScrollIndicator={false}
//             ListEmptyComponent={<View style={s.emptyBox}><Text style={s.emptyEmoji}>🏫</Text><Text style={s.emptyTitle}>{searchQuery?'No results found':'No classes yet'}</Text><Text style={s.emptySub}>{searchQuery?'Try a different search':'Tap + New to create your first class'}</Text></View>}
//             refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary}/>}
//             ItemSeparatorComponent={()=><View style={{height:12}}/>}
//           />
//         ):(
//           <FlatList data={filteredSubjects} keyExtractor={keyExtractor} renderItem={renderSubject}
//             contentContainerStyle={[s.list,filteredSubjects.length===0&&s.listEmpty]}
//             showsVerticalScrollIndicator={false}
//             ListEmptyComponent={<View style={s.emptyBox}><Text style={s.emptyEmoji}>📚</Text><Text style={s.emptyTitle}>{searchQuery?'No results found':'No subjects yet'}</Text><Text style={s.emptySub}>{searchQuery?'Try a different search':'Tap + New to create your first subject'}</Text></View>}
//             refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary}/>}
//             ItemSeparatorComponent={()=><View style={{height:12}}/>}
//           />
//         )}
//       </View>

//       {/* FAB */}
//       <TouchableOpacity style={s.fab} onPress={()=>setActionSheet(true)} activeOpacity={0.85}>
//         <Text style={s.fabIcon}>＋</Text>
//       </TouchableOpacity>

//       {/* Modals */}
//       <ActionSheet visible={actionSheet} onClose={()=>setActionSheet(false)}
//         onSelect={(key)=>{if(key==='class')setClassModal(true);if(key==='subject')setSubjectModal(true);if(key==='assign')setAssignModal(true);}}/>
//       <CreateClassModal visible={classModal} onClose={()=>setClassModal(false)} onSave={handleCreateClass} students={students}/>
//       <CreateSubjectModal visible={subjectModal} onClose={()=>setSubjectModal(false)} onSave={handleCreateSubject} teachers={teachers}/>
//       <AssignSubjectModal visible={assignModal} onClose={()=>setAssignModal(false)} onSave={handleAssignSubjects} classes={classes} subjects={subjects}/>
//     </View>
//   );
// };

// const s = StyleSheet.create({
//   container:{flex:1,backgroundColor:COLORS.background},
//   header:{backgroundColor:COLORS.primary,paddingTop:52,paddingHorizontal:20,paddingBottom:20,borderBottomLeftRadius:28,borderBottomRightRadius:28},
//   hdrTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:16},
//   hdrTitle:{fontSize:22,fontWeight:'800',color:'#fff',letterSpacing:-0.3},
//   hdrSub:{fontSize:13,color:'rgba(255,255,255,0.70)',marginTop:2},
//   hdrBtn:{backgroundColor:'rgba(255,255,255,0.22)',borderRadius:20,paddingVertical:8,paddingHorizontal:16,borderWidth:1.5,borderColor:'rgba(255,255,255,0.35)'},
//   hdrBtnTxt:{color:'#fff',fontWeight:'700',fontSize:14},
//   statsStrip:{flexDirection:'row',backgroundColor:'rgba(255,255,255,0.15)',borderRadius:14,paddingVertical:10,paddingHorizontal:12,alignItems:'center',justifyContent:'space-around'},
//   statPill:{alignItems:'center',flex:1},
//   statNum:{color:'#fff',fontSize:17,fontWeight:'800'},
//   statLbl:{color:'rgba(255,255,255,0.70)',fontSize:11,fontWeight:'500',marginTop:1},
//   statDiv:{width:1,height:26,backgroundColor:'rgba(255,255,255,0.25)'},
//   screenTabRow:{flexDirection:'row',marginHorizontal:18,marginTop:18,gap:10},
//   screenTab:{flex:1,paddingVertical:10,borderRadius:12,alignItems:'center',backgroundColor:COLORS.card,borderWidth:1.5,borderColor:COLORS.border},
//   screenTabOn:{backgroundColor:COLORS.primary,borderColor:COLORS.primary},
//   screenTabTxt:{fontSize:14,fontWeight:'700',color:COLORS.textSecondary},
//   screenTabTxtOn:{color:'#fff'},
//   body:{flex:1,paddingTop:16},
//   searchWrap:{paddingHorizontal:18,marginBottom:14},
//   searchBar:{flexDirection:'row',alignItems:'center',backgroundColor:COLORS.card,borderRadius:16,paddingHorizontal:14,paddingVertical:12,shadowColor:COLORS.shadow,shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:3,borderWidth:1,borderColor:COLORS.border},
//   searchIcon:{fontSize:16,marginRight:10},
//   searchInput:{flex:1,fontSize:15,color:COLORS.text,paddingVertical:0},
//   clearIcon:{fontSize:14,color:COLORS.textLight,fontWeight:'600',paddingLeft:8},
//   tabsRow:{flexDirection:'row',paddingHorizontal:18,gap:8,marginBottom:12},
//   tab:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:COLORS.card,borderRadius:12,paddingVertical:8,paddingHorizontal:4,gap:4,borderWidth:1.5,borderColor:COLORS.border},
//   tabOn:{backgroundColor:COLORS.primary,borderColor:COLORS.primary},
//   tabLbl:{fontSize:11,fontWeight:'600',color:COLORS.textSecondary},
//   tabLblOn:{color:'#fff'},
//   tabCnt:{backgroundColor:COLORS.inputBg,borderRadius:8,paddingHorizontal:5,paddingVertical:1,minWidth:18,alignItems:'center'},
//   tabCntOn:{backgroundColor:'rgba(255,255,255,0.25)'},
//   tabCntTxt:{fontSize:10,fontWeight:'700',color:COLORS.textSecondary},
//   tabCntTxtOn:{color:'#fff'},
//   meta:{paddingHorizontal:20,marginBottom:10},
//   metaTxt:{fontSize:13,color:COLORS.textSecondary,fontWeight:'500'},
//   list:{paddingHorizontal:18,paddingBottom:100},
//   listEmpty:{flex:1},
//   loader:{flex:1,alignItems:'center',justifyContent:'center',gap:12},
//   loaderTxt:{fontSize:15,color:COLORS.textSecondary,fontWeight:'500'},
//   emptyBox:{flex:1,alignItems:'center',justifyContent:'center',paddingVertical:64,paddingHorizontal:32},
//   emptyEmoji:{fontSize:52,marginBottom:14},
//   emptyTitle:{fontSize:18,fontWeight:'700',color:COLORS.text,marginBottom:8},
//   emptySub:{fontSize:14,color:COLORS.textSecondary,textAlign:'center',lineHeight:20},
//   classCard:{backgroundColor:COLORS.card,borderRadius:18,overflow:'hidden',shadowColor:COLORS.shadow,shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:3},
//   stripe:{height:4},
//   cardBody:{flexDirection:'row',alignItems:'center',padding:14},
//   cardLeft:{flex:1,flexDirection:'row',alignItems:'flex-start'},
//   av:{width:48,height:48,borderRadius:15,alignItems:'center',justifyContent:'center',marginRight:12},
//   avTxt:{color:'#fff',fontWeight:'800',fontSize:15},
//   info:{flex:1,gap:4},
//   clsName:{fontSize:16,fontWeight:'700',color:COLORS.text,letterSpacing:-0.2,marginBottom:2},
//   infoRow:{flexDirection:'row',alignItems:'center',gap:5,flexWrap:'wrap'},
//   infoIcon:{fontSize:12},
//   infoTxt:{fontSize:12,color:COLORS.textSecondary,fontWeight:'500'},
//   wBadge:{backgroundColor:COLORS.warningLight,borderRadius:6,paddingHorizontal:6,paddingVertical:1},
//   wBadgeTxt:{fontSize:10,color:COLORS.warning,fontWeight:'700'},
//   actions:{flexDirection:'column',gap:8,marginLeft:8},
//   actBtn:{width:36,height:36,borderRadius:11,alignItems:'center',justifyContent:'center'},
//   actIcon:{fontSize:15},
//   subCard:{backgroundColor:COLORS.card,borderRadius:18,padding:14,flexDirection:'row',alignItems:'center',shadowColor:COLORS.shadow,shadowOffset:{width:0,height:2},shadowOpacity:0.06,shadowRadius:8,elevation:3,gap:12},
//   subIconBox:{width:48,height:48,borderRadius:15,alignItems:'center',justifyContent:'center'},
//   subIcon:{fontSize:22},
//   subInfo:{flex:1,gap:4},
//   subName:{fontSize:15,fontWeight:'700',color:COLORS.text,letterSpacing:-0.1},
//   fab:{position:'absolute',bottom:28,right:22,width:58,height:58,borderRadius:20,backgroundColor:COLORS.primary,alignItems:'center',justifyContent:'center',shadowColor:COLORS.primary,shadowOffset:{width:0,height:6},shadowOpacity:0.40,shadowRadius:14,elevation:10},
//   fabIcon:{color:'#fff',fontSize:28,fontWeight:'300',lineHeight:32},
// });

// export default ClassesScreen;















// src/screens/admin/ClassesScreen.js
//
// ─── WHAT THIS FILE DOES ──────────────────────────────────────────────────────
// Admin manages classes, students inside each class, and subjects per class.
//
// ─── TWO VIEWS ────────────────────────────────────────────────────────────────
// view = 'list'   → shows all classes as tappable cards
// view = 'detail' → inside a class: two tabs (Students | Subjects)
//
// ─── STUDENTS TAB ─────────────────────────────────────────────────────────────
// • Add one by one via form
// • Upload Excel → preview → edit inline → commit to Firestore
// • Students saved in users collection with role:'student' + extra fields
// • Student UID added to classes/{classId}.students[]
//
// ─── SUBJECTS TAB ─────────────────────────────────────────────────────────────
// • Each operation (add/edit/delete) fires immediately — NO bulk commit
// • WHY: bulk replace would break attendance records that reference subjectId
// • Add → new class_subjects doc
// • Edit teacher → updateDoc on existing doc (subjectId unchanged)
// • Delete → warns admin → deletes class_subjects doc
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Alert,
  RefreshControl, Modal, ScrollView, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  query, orderBy, serverTimestamp, updateDoc,
  arrayUnion, writeBatch, getDoc,
} from 'firebase/firestore';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
// WHY /legacy: newer Expo SDK deprecated the old API from 'expo-file-system'
// but readAsStringAsync still works perfectly via the legacy import path
// no code changes needed — just the import path changes
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx';
import { db } from '../../services/firebase/config';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc } from 'firebase/firestore';

// ─── Secondary Firebase Auth (so admin session is never interrupted) ──────────
// WHY: createUserWithEmailAndPassword signs IN as the new user
// Using a secondary app prevents admin from being signed out
const SECONDARY_APP_NAME = 'SecondaryAppClasses';
const getSecondaryAuth = () => {
  const firebaseConfig = {
    apiKey: "AIzaSyAmvBa6G9kt6Vrjx0_tf_QJoKAwMPrMSLA",
    authDomain: "saapt-new.firebaseapp.com",
    projectId: "saapt-new",
    storageBucket: "saapt-new.firebasestorage.app",
    messagingSenderId: "1084667160499",
    appId: "1:1084667160499:web:9f45f6cf28de68c4090dc6",
  };
  const existing = getApps().find(a => a.name === SECONDARY_APP_NAME);
  if (existing) return getAuth(existing);
  return getAuth(initializeApp(firebaseConfig, SECONDARY_APP_NAME));
};

// ─── Default student password ─────────────────────────────────────────────────
const DEFAULT_STUDENT_PASSWORD = 'saapt123456';

// ─── Batch options ────────────────────────────────────────────────────────────
// Stored and displayed as single letters: A, B, C
const BATCH_OPTIONS = ['A', 'B', 'C'];

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  primary:       '#4F46E5', primaryLight: '#EEF2FF',
  secondary:     '#06B6D4', secondaryLight: '#ECFEFF',
  success:       '#10B981', successLight: '#D1FAE5',
  danger:        '#EF4444', dangerLight: '#FEF2F2',
  warning:       '#F59E0B', warningLight: '#FEF3C7',
  purple:        '#8B5CF6', purpleLight: '#F5F3FF',
  orange:        '#F97316', orangeLight: '#FFF7ED',
  bg:            '#F8F9FE', card: '#FFFFFF',
  text:          '#1E1B4B', textSec: '#6B7280', textLight: '#9CA3AF',
  border:        '#E5E7EB', inputBg: '#F3F4F6',
  overlay:       'rgba(30,27,75,0.55)',
};

// ─── Batch badge colors ───────────────────────────────────────────────────────
const BATCH_COLORS = {
  'A': { bg: '#EEF2FF', text: '#4F46E5', border: '#C7D2FE' },
  'B': { bg: '#ECFEFF', text: '#0891B2', border: '#A5F3FC' },
  'C': { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
};

// ─── Class accent colors (deterministic by class ID) ─────────────────────────
const CLASS_COLORS = ['#4F46E5','#06B6D4','#10B981','#F59E0B','#8B5CF6','#EC4899','#EF4444'];
const classColor = (id='') =>
  CLASS_COLORS[id.split('').reduce((a,c)=>a+c.charCodeAt(0),0) % CLASS_COLORS.length];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getInitials = (name='') => {
  const w = name.trim().split(/\s+/);
  return w.length >= 2
    ? `${w[0][0]}${w[1][0]}`.toUpperCase()
    : name.substring(0,2).toUpperCase() || '?';
};

// ─── Reusable: Batch Picker ───────────────────────────────────────────────────
// WHY separate component: used in both AddStudentModal and ExcelPreviewScreen edit form
const BatchPicker = ({ value, onChange, style }) => (
  <View style={[{ flexDirection:'row', gap:8, marginTop:2 }, style]}>
    {BATCH_OPTIONS.map(b => {
      const selected = value === b;
      const colors = BATCH_COLORS[b];
      return (
        <TouchableOpacity
          key={b}
          onPress={() => onChange(b)}
          activeOpacity={0.8}
          style={{
            flex: 1,
            paddingVertical: 11,
            borderRadius: 12,
            alignItems: 'center',
            backgroundColor: selected ? colors.bg : C.inputBg,
            borderWidth: 2,
            borderColor: selected ? colors.border : C.border,
          }}
        >
          <Text style={{
            fontSize: 13,
            fontWeight: selected ? '800' : '600',
            color: selected ? colors.text : C.textLight,
          }}>
            {b}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ── Reusable: Batch Badge (read-only display) ─────────────────────────────────
const BatchBadge = ({ batch, small }) => {
  if (!batch) return null;
  const colors = BATCH_COLORS[batch] ?? { bg: C.inputBg, text: C.textSec, border: C.border };
  return (
    <View style={{
      backgroundColor: colors.bg,
      borderRadius: 8,
      paddingHorizontal: small ? 6 : 8,
      paddingVertical: small ? 2 : 3,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignSelf: 'flex-start',
    }}>
      <Text style={{
        fontSize: small ? 10 : 11,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: 0.2,
      }}>
        {batch}
      </Text>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MODAL: CREATE CLASS
// ══════════════════════════════════════════════════════════════════════════════
const CreateClassModal = ({ visible, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a class name.');
      return;
    }
    setSaving(true);
    await onSave(name.trim());
    setName('');
    setSaving(false);
  };

  const handleClose = () => { setName(''); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={ms.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'}>
          <View style={ms.sheet}>
            <View style={ms.handle} />
            <View style={ms.hdrRow}>
              <View style={ms.hdrIcon}><Text style={ms.hdrIconTxt}>🏫</Text></View>
              <View style={{flex:1}}>
                <Text style={ms.title}>Create New Class</Text>
                <Text style={ms.subtitle}>Enter a name for this class</Text>
              </View>
              <TouchableOpacity style={ms.closeBtn} onPress={handleClose}>
                <Text style={ms.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={ms.fGroup}>
              <Text style={ms.lbl}>Class Name <Text style={ms.req}>*</Text></Text>
              <View style={ms.inRow}>
                <Text style={ms.inIcon}>🏫</Text>
                <TextInput
                  style={ms.input}
                  placeholder="e.g. FY-A, Class 10B, Batch 2025"
                  placeholderTextColor={C.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoFocus
                />
              </View>
            </View>
            <TouchableOpacity
              style={[ms.saveBtn, { backgroundColor: C.primary }, saving && ms.saveBtnOff]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={ms.saveBtnTxt}>Create Class  →</Text>
              }
            </TouchableOpacity>
            <View style={{height:32}} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MODAL: ADD STUDENT (one by one)
//  ── CHANGED: Added batch field (required, A/B/C picker) ──────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const AddStudentModal = ({ visible, onClose, onSave }) => {
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [rollNo,      setRollNo]      = useState('');
  const [enrollment,  setEnrollment]  = useState('');
  const [parentEmail, setParentEmail] = useState('');
  // ── NEW: batch selection ──────────────────────────────────────────────────
  const [batch,       setBatch]       = useState('');
  const [saving,      setSaving]      = useState(false);

  const reset = () => {
    setName(''); setEmail(''); setPhone('');
    setRollNo(''); setEnrollment(''); setParentEmail('');
    setBatch('');   // ← reset batch
    setSaving(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Required', 'Name is required.'); return; }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Required', 'Valid email is required.'); return;
    }
    // ── NEW: batch is required ────────────────────────────────────────────
    if (!batch) {
      Alert.alert('Required', 'Please select a batch (A, B, or C).'); return;
    }
    setSaving(true);
    await onSave({
      name:               name.trim(),
      email:              email.trim().toLowerCase(),
      phone:              phone.trim(),
      roll_number:        rollNo.trim(),
      enrollment_number:  enrollment.trim(),
      parent_email:       parentEmail.trim().toLowerCase(),
      batch,              // ← pass batch to parent
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={ms.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={{justifyContent:'flex-end'}}>
          <View style={[ms.sheet, {maxHeight:'93%'}]}>
            <View style={ms.handle} />
            <View style={ms.hdrRow}>
              <View style={[ms.hdrIcon,{backgroundColor:C.secondaryLight}]}>
                <Text style={ms.hdrIconTxt}>🎓</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={ms.title}>Add Student</Text>
                <Text style={ms.subtitle}>Password auto-set to default</Text>
              </View>
              <TouchableOpacity style={ms.closeBtn} onPress={handleClose}>
                <Text style={ms.closeTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              {/* Name */}
              <View style={ms.fGroup}>
                <Text style={ms.lbl}>Full Name <Text style={ms.req}>*</Text></Text>
                <View style={ms.inRow}>
                  <Text style={ms.inIcon}>👤</Text>
                  <TextInput style={ms.input} placeholder="e.g. Ravi Sharma"
                    placeholderTextColor={C.textLight} value={name}
                    onChangeText={setName} autoCapitalize="words" />
                </View>
              </View>

              {/* Email */}
              <View style={ms.fGroup}>
                <Text style={ms.lbl}>Email Address <Text style={ms.req}>*</Text></Text>
                <View style={ms.inRow}>
                  <Text style={ms.inIcon}>📧</Text>
                  <TextInput style={ms.input} placeholder="student@email.com"
                    placeholderTextColor={C.textLight} value={email}
                    onChangeText={setEmail} keyboardType="email-address"
                    autoCapitalize="none" autoCorrect={false} />
                </View>
              </View>

              {/* ── NEW: Batch Picker ──────────────────────────────────────── */}
              <View style={ms.fGroup}>
                <Text style={ms.lbl}>
                  Batch <Text style={ms.req}>*</Text>
                </Text>
                <BatchPicker value={batch} onChange={setBatch} />
                {/* Visual hint if nothing selected */}
                {!batch && (
                  <Text style={{fontSize:11, color:C.danger, marginTop:5, marginLeft:2}}>
                    ⚠️ Batch selection is required
                  </Text>
                )}
              </View>

              {/* Phone */}
              <View style={ms.fGroup}>
                <Text style={ms.lbl}>Phone <Text style={ms.opt}>(optional)</Text></Text>
                <View style={ms.inRow}>
                  <Text style={ms.inIcon}>📞</Text>
                  <TextInput style={ms.input} placeholder="+91 9876543210"
                    placeholderTextColor={C.textLight} value={phone}
                    onChangeText={setPhone} keyboardType="phone-pad" />
                </View>
              </View>

              {/* Roll Number */}
              <View style={ms.fGroup}>
                <Text style={ms.lbl}>Roll Number <Text style={ms.opt}>(optional)</Text></Text>
                <View style={ms.inRow}>
                  <Text style={ms.inIcon}>🔢</Text>
                  <TextInput style={ms.input} placeholder="e.g. 23CS001"
                    placeholderTextColor={C.textLight} value={rollNo}
                    onChangeText={setRollNo} autoCapitalize="characters" />
                </View>
              </View>

              {/* Enrollment Number */}
              <View style={ms.fGroup}>
                <Text style={ms.lbl}>Enrollment Number <Text style={ms.opt}>(optional)</Text></Text>
                <View style={ms.inRow}>
                  <Text style={ms.inIcon}>🪪</Text>
                  <TextInput style={ms.input} placeholder="e.g. EN2023001"
                    placeholderTextColor={C.textLight} value={enrollment}
                    onChangeText={setEnrollment} autoCapitalize="characters" />
                </View>
              </View>

              {/* Parent Email */}
              <View style={ms.fGroup}>
                <Text style={ms.lbl}>Parent Email <Text style={ms.opt}>(optional)</Text></Text>
                <View style={ms.inRow}>
                  <Text style={ms.inIcon}>👨‍👩‍👧</Text>
                  <TextInput style={ms.input} placeholder="parent@email.com"
                    placeholderTextColor={C.textLight} value={parentEmail}
                    onChangeText={setParentEmail} keyboardType="email-address"
                    autoCapitalize="none" autoCorrect={false} />
                </View>
              </View>

              {/* Password note */}
              <View style={ms.infoBox}>
                <Text style={ms.infoTxt}>
                  🔒 Password will be set to <Text style={{fontWeight:'800'}}>saapt123456</Text> automatically
                </Text>
              </View>

              <TouchableOpacity
                style={[ms.saveBtn, {backgroundColor:C.secondary}, saving && ms.saveBtnOff]}
                onPress={handleSave} disabled={saving} activeOpacity={0.85}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={ms.saveBtnTxt}>Add Student  →</Text>
                }
              </TouchableOpacity>
              <View style={{height:32}} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MODAL: EXCEL INSTRUCTIONS
//  ── CHANGED: Added batch as required column ───────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const ExcelInstructionsModal = ({ visible, onClose, onProceed }) => (
  <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
    <View style={ms.overlay}>
      <View style={[ms.sheet, {marginHorizontal:20, borderRadius:24}]}>
        <View style={ms.handle} />
        <Text style={ms.title}>📊 Excel Upload Instructions</Text>
        <Text style={[ms.subtitle, {marginBottom:16}]}>
          Make sure your Excel file has these exact column names (row 1):
        </Text>

        {[
          {col:'name',               req:true,  desc:'Full name of student'},
          {col:'email',              req:true,  desc:'Email address (used for login)'},
          // ── NEW: batch is required ──────────────────────────────────────
          {col:'batch',              req:true,  desc:'Student batch — must be exactly: A, B, or C'},
          {col:'phone',              req:false, desc:'Phone number'},
          {col:'roll_number',        req:false, desc:'Roll number e.g. 23CS001'},
          {col:'enrollment_number',  req:false, desc:'Enrollment number'},
          {col:'parent_email',       req:false, desc:'Parent email address'},
        ].map(({col, req, desc}) => (
          <View key={col} style={ms.colRow}>
            <View style={[ms.colBadge, {backgroundColor: req ? C.dangerLight : C.successLight}]}>
              <Text style={[ms.colBadgeTxt, {color: req ? C.danger : C.success}]}>
                {req ? 'Required' : 'Optional'}
              </Text>
            </View>
            <View style={{flex:1}}>
              <Text style={ms.colName}>{col}</Text>
              <Text style={ms.colDesc}>{desc}</Text>
            </View>
          </View>
        ))}

        {/* Batch values hint box */}
        <View style={[ms.infoBox, {backgroundColor: C.primaryLight, borderColor: C.primary}]}>
          <Text style={[ms.infoTxt, {color: C.primary}]}>
            📌 Valid batch values: <Text style={{fontWeight:'800'}}>A</Text>{"  "}
            <Text style={{fontWeight:'800'}}>B</Text>{"  "}
            <Text style={{fontWeight:'800'}}>C</Text>
            {'\n'}Values are case-sensitive. Students with invalid/missing batch will be skipped.
          </Text>
        </View>

        <View style={ms.infoBox}>
          <Text style={ms.infoTxt}>
            ⚠️ Column names are case-sensitive. Copy them exactly as shown above.
            Password will be auto-set to saapt123456 for all students.
          </Text>
        </View>

        <View style={{flexDirection:'row', gap:10, marginTop:8}}>
          <TouchableOpacity
            style={[ms.saveBtn, {flex:1, backgroundColor:C.border, marginTop:0}]}
            onPress={onClose} activeOpacity={0.8}
          >
            <Text style={[ms.saveBtnTxt, {color:C.text}]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[ms.saveBtn, {flex:1, backgroundColor:C.primary, marginTop:0}]}
            onPress={onProceed} activeOpacity={0.85}
          >
            <Text style={ms.saveBtnTxt}>Pick File  →</Text>
          </TouchableOpacity>
        </View>
        <View style={{height:24}} />
      </View>
    </View>
  </Modal>
);

// ══════════════════════════════════════════════════════════════════════════════
//  SCREEN: EXCEL PREVIEW
//  ── CHANGED: Added batch field to edit form + preview display ────────────────
// ══════════════════════════════════════════════════════════════════════════════
const ExcelPreviewScreen = ({ students: initialStudents, onBack, onCommit, committing }) => {
  const [students, setStudents] = useState(
    initialStudents.map((s, i) => ({ ...s, _key: String(i) }))
  );
  const [editingKey, setEditingKey] = useState(null);
  const [editVals,   setEditVals]   = useState({});

  const startEdit = (student) => {
    setEditingKey(student._key);
    setEditVals({ ...student });
  };

  const saveEdit = () => {
    // Validate batch before saving edit
    if (!editVals.batch || !BATCH_OPTIONS.includes(editVals.batch)) {
      Alert.alert('Required', 'Please select a valid batch (A, B, or C).');
      return;
    }
    setStudents(prev =>
      prev.map(s => s._key === editingKey ? { ...editVals, _key: editingKey } : s)
    );
    setEditingKey(null);
  };

  const removeStudent = (key) => {
    Alert.alert('Remove', 'Remove this student from the list?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive',
        onPress: () => setStudents(prev => prev.filter(s => s._key !== key)) },
    ]);
  };

  // Count students with missing/invalid batch — warn admin before commit
  const invalidBatchCount = students.filter(s => !s.batch || !BATCH_OPTIONS.includes(s.batch)).length;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={s.detailHeader}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={s.backBtnTxt}>‹</Text>
        </TouchableOpacity>
        <View style={{flex:1}}>
          <Text style={s.detailTitle}>Preview Students</Text>
          <Text style={s.detailSub}>{students.length} students from Excel — review before committing</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{padding:16}}>
          <View style={[ms.infoBox, {marginBottom:16}]}>
            <Text style={ms.infoTxt}>
              📝 Tap ✏️ to edit any student's info including batch.
              Tap 🗑️ to remove. When ready tap Commit to push all to database.
            </Text>
          </View>

          {/* Batch warning if any students are missing batch */}
          {invalidBatchCount > 0 && (
            <View style={[ms.infoBox, {backgroundColor:C.dangerLight, borderColor:C.danger, marginBottom:16}]}>
              <Text style={[ms.infoTxt, {color:C.danger}]}>
                ⚠️ {invalidBatchCount} student{invalidBatchCount>1?'s have':' has'} missing or invalid batch.
                Please edit them before committing — they will be skipped otherwise.
              </Text>
            </View>
          )}

          {students.map((student) => (
            <View key={student._key} style={s.previewCard}>
              {editingKey === student._key ? (
                // ── Inline edit form ─────────────────────────────────────────
                <View>
                  <Text style={s.previewEditTitle}>Editing student</Text>

                  {/* ── NEW: Batch picker in edit form ────────────────────── */}
                  <View style={{marginBottom:12}}>
                    <Text style={s.previewEditLabel}>
                      Batch <Text style={{color:C.danger}}>*</Text>
                    </Text>
                    <BatchPicker
                      value={editVals.batch}
                      onChange={v => setEditVals(prev => ({...prev, batch: v}))}
                    />
                  </View>

                  {[
                    {key:'name',              label:'Name',         keyboard:'default'},
                    {key:'email',             label:'Email',        keyboard:'email-address'},
                    {key:'phone',             label:'Phone',        keyboard:'phone-pad'},
                    {key:'roll_number',       label:'Roll Number',  keyboard:'default'},
                    {key:'enrollment_number', label:'Enrollment No',keyboard:'default'},
                    {key:'parent_email',      label:'Parent Email', keyboard:'email-address'},
                  ].map(({key, label, keyboard}) => (
                    <View key={key} style={s.previewEditRow}>
                      <Text style={s.previewEditLabel}>{label}</Text>
                      <TextInput
                        style={s.previewEditInput}
                        value={editVals[key] ?? ''}
                        onChangeText={v => setEditVals(prev => ({...prev, [key]: v}))}
                        keyboardType={keyboard}
                        autoCapitalize={keyboard==='email-address'?'none':'words'}
                        placeholderTextColor={C.textLight}
                      />
                    </View>
                  ))}
                  <TouchableOpacity
                    style={[ms.saveBtn,{backgroundColor:C.success,marginTop:8}]}
                    onPress={saveEdit} activeOpacity={0.85}
                  >
                    <Text style={ms.saveBtnTxt}>✓ Save Changes</Text>
                  </TouchableOpacity>
                </View>

              ) : (
                // ── Read-only row ──────────────────────────────────────────
                <View style={s.previewRow}>
                  <View style={[s.previewAvatar, {backgroundColor:C.secondary}]}>
                    <Text style={s.previewAvatarTxt}>{getInitials(student.name||'?')}</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={s.previewName}>{student.name || '—'}</Text>
                    <Text style={s.previewEmail}>{student.email || '—'}</Text>
                    <View style={{flexDirection:'row', alignItems:'center', gap:6, marginTop:4}}>
                      {/* ── NEW: Show batch badge ────────────────────────── */}
                      {student.batch
                        ? <BatchBadge batch={student.batch} small />
                        : <Text style={{fontSize:10, color:C.danger, fontWeight:'700'}}>⚠️ No batch</Text>
                      }
                      {!!student.roll_number && (
                        <Text style={s.previewMeta}>🔢 {student.roll_number}</Text>
                      )}
                    </View>
                  </View>
                  <View style={{flexDirection:'row', gap:6}}>
                    <TouchableOpacity
                      style={[s.previewAction, {backgroundColor:C.primaryLight}]}
                      onPress={() => startEdit(student)} activeOpacity={0.7}
                    >
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.previewAction, {backgroundColor:C.dangerLight}]}
                      onPress={() => removeStudent(student._key)} activeOpacity={0.7}
                    >
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity
            style={[ms.saveBtn, {backgroundColor:C.success}, committing && ms.saveBtnOff]}
            onPress={() => onCommit(students)}
            disabled={committing || students.length === 0}
            activeOpacity={0.85}
          >
            {committing
              ? <ActivityIndicator color="#fff" />
              : <Text style={ms.saveBtnTxt}>
                  ✅ Commit {students.length} Student{students.length !== 1 ? 's' : ''} to Database
                </Text>
            }
          </TouchableOpacity>
          <View style={{height:40}} />
        </View>
      </ScrollView>
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  COMPONENT: SUBJECT MANAGER
//  Each operation (add/edit/delete) fires immediately — no bulk commit
// ══════════════════════════════════════════════════════════════════════════════
const SubjectManager = ({ classId, className, teachers }) => {
  const [subjects,      setSubjects]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [addName,       setAddName]       = useState('');
  const [addTeacher,    setAddTeacher]    = useState(null);
  const [showTeacherDD, setShowTeacherDD] = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [editId,        setEditId]        = useState(null);
  const [editTeacher,   setEditTeacher]   = useState(null);

  const loadSubjects = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db,'class_subjects')));
      const rows = snap.docs
        .map(d => ({id:d.id, ...d.data()}))
        .filter(d => d.classId === classId);
      rows.sort((a,b) => (a.subjectName||'').localeCompare(b.subjectName||''));
      setSubjects(rows);
    } catch(e) {
      console.error('loadSubjects error:', e);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { loadSubjects(); }, [loadSubjects]);

  const handleAdd = async () => {
    if (!addName.trim()) {
      Alert.alert('Required', 'Please enter a subject name.'); return;
    }
    if (!addTeacher) {
      Alert.alert('Required', 'Please select a teacher.'); return;
    }
    setSaving(true);
    try {
      const ref = await addDoc(collection(db,'class_subjects'), {
        classId,
        className,
        subjectId:   '',
        subjectName: addName.trim(),
        teacherId:   addTeacher.id,
        teacherName: addTeacher.name ?? addTeacher.full_name ?? '',
        createdAt:   serverTimestamp(),
      });
      await updateDoc(ref, { subjectId: ref.id });
      setSubjects(prev => [...prev, {
        id:          ref.id,
        classId,
        className,
        subjectId:   ref.id,
        subjectName: addName.trim(),
        teacherId:   addTeacher.id,
        teacherName: addTeacher.name ?? addTeacher.full_name ?? '',
      }].sort((a,b)=>a.subjectName.localeCompare(b.subjectName)));
      setAddName('');
      setAddTeacher(null);
    } catch(e) {
      Alert.alert('Error', 'Failed to add subject.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSave = async (subjectDocId) => {
    if (!editTeacher) {
      Alert.alert('Required', 'Please select a teacher.'); return;
    }
    try {
      await updateDoc(doc(db,'class_subjects',subjectDocId), {
        teacherId:   editTeacher.id,
        teacherName: editTeacher.name ?? editTeacher.full_name ?? '',
      });
      setSubjects(prev => prev.map(s =>
        s.id === subjectDocId
          ? { ...s, teacherId: editTeacher.id, teacherName: editTeacher.name ?? editTeacher.full_name ?? '' }
          : s
      ));
      setEditId(null);
      setEditTeacher(null);
    } catch(e) {
      Alert.alert('Error', 'Failed to update subject.');
    }
  };

  const handleDelete = (subject) => {
    Alert.alert(
      'Delete Subject',
      `Delete "${subject.subjectName}" from ${className}?\n\nThis will also delete all attendance records for this subject in this class.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              // Step 1: delete class_subjects doc
              await deleteDoc(doc(db,'class_subjects',subject.id));

              // Step 2: delete all attendance docs for this class+subject
              const attSnap = await getDocs(collection(db,'attendance'));
              const relatedAtt = attSnap.docs.filter(d => {
                const data = d.data();
                return data.classId === classId && data.subjectId === subject.subjectId;
              });
              await Promise.all(relatedAtt.map(d => deleteDoc(d.ref)));

              setSubjects(prev => prev.filter(s => s.id !== subject.id));
              Alert.alert('✅ Deleted', `"${subject.subjectName}" and its attendance records deleted.`);
            } catch(e) {
              Alert.alert('Error', 'Failed to delete subject.');
              console.error(e);
            }
          },
        },
      ]
    );
  };

  if (loading) return (
    <View style={{alignItems:'center', paddingVertical:40}}>
      <ActivityIndicator size="large" color={C.primary} />
    </View>
  );

  return (
    <View style={{paddingHorizontal:16}}>

      {/* ── Add New Subject ───────────────────────────────────────────────── */}
      <View style={s.subAddCard}>
        <Text style={s.subAddTitle}>➕ Add New Subject</Text>
        <View style={ms.inRow}>
          <Text style={ms.inIcon}>📚</Text>
          <TextInput
            style={ms.input}
            placeholder="Subject name e.g. Mathematics"
            placeholderTextColor={C.textLight}
            value={addName}
            onChangeText={setAddName}
            autoCapitalize="words"
          />
        </View>
        <TouchableOpacity
          style={[ms.inRow, {marginTop:10}]}
          onPress={() => setShowTeacherDD(true)}
          activeOpacity={0.8}
        >
          <Text style={ms.inIcon}>👩‍🏫</Text>
          <Text style={[ms.input, {color: addTeacher ? C.text : C.textLight, paddingVertical:13}]}>
            {addTeacher
              ? (addTeacher.name ?? addTeacher.full_name ?? 'Teacher')
              : 'Select teacher...'}
          </Text>
          <Text style={{fontSize:12, color:C.textLight, marginRight:4}}>▼</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ms.saveBtn, {backgroundColor:C.primary, marginTop:12}, saving && ms.saveBtnOff]}
          onPress={handleAdd} disabled={saving} activeOpacity={0.85}
        >
          {saving
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={ms.saveBtnTxt}>+ Add Subject</Text>
          }
        </TouchableOpacity>
      </View>

      {/* ── Existing Subjects List ─────────────────────────────────────── */}
      {subjects.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyEmoji}>📚</Text>
          <Text style={s.emptyTitle}>No Subjects Yet</Text>
          <Text style={s.emptySub}>Add subjects using the form above</Text>
        </View>
      ) : (
        <>
          <Text style={s.sectionLabel}>EXISTING SUBJECTS — {subjects.length}</Text>
          {subjects.map(sub => (
            <View key={sub.id} style={s.subjectRow}>
              {editId === sub.id ? (
                <View style={{flex:1}}>
                  <Text style={s.subjectName}>{sub.subjectName}</Text>
                  <Text style={s.subjectTeacher}>Change teacher:</Text>
                  <TouchableOpacity
                    style={[ms.inRow, {marginTop:6}]}
                    onPress={() => setShowTeacherDD('edit')}
                    activeOpacity={0.8}
                  >
                    <Text style={ms.inIcon}>👩‍🏫</Text>
                    <Text style={[ms.input, {color: editTeacher ? C.text : C.textLight, paddingVertical:10}]}>
                      {editTeacher
                        ? (editTeacher.name ?? editTeacher.full_name)
                        : 'Select teacher...'}
                    </Text>
                    <Text style={{fontSize:12,color:C.textLight,marginRight:4}}>▼</Text>
                  </TouchableOpacity>
                  <View style={{flexDirection:'row',gap:8,marginTop:8}}>
                    <TouchableOpacity
                      style={[ms.saveBtn,{flex:1,backgroundColor:C.success,marginTop:0}]}
                      onPress={() => handleEditSave(sub.id)} activeOpacity={0.85}
                    >
                      <Text style={ms.saveBtnTxt}>✓ Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[ms.saveBtn,{flex:1,backgroundColor:C.border,marginTop:0}]}
                      onPress={() => {setEditId(null);setEditTeacher(null);}} activeOpacity={0.8}
                    >
                      <Text style={[ms.saveBtnTxt,{color:C.text}]}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <View style={s.subjectIconBox}>
                    <Text style={{fontSize:20}}>📚</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={s.subjectName}>{sub.subjectName}</Text>
                    <Text style={s.subjectTeacher}>
                      👩‍🏫 {sub.teacherName || 'No teacher assigned'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[s.subjectAction,{backgroundColor:C.primaryLight}]}
                    onPress={() => { setEditId(sub.id); setEditTeacher(null); }}
                    activeOpacity={0.7}
                  >
                    <Text>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.subjectAction,{backgroundColor:C.dangerLight}]}
                    onPress={() => handleDelete(sub)}
                    activeOpacity={0.7}
                  >
                    <Text>🗑️</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}
        </>
      )}

      {/* ── Teacher Dropdown Modal ─────────────────────────────────────── */}
      <Modal
        visible={showTeacherDD !== false}
        animationType="slide" transparent
        onRequestClose={() => setShowTeacherDD(false)}
      >
        <View style={ms.overlay}>
          <View style={[ms.sheet,{maxHeight:'70%'}]}>
            <View style={ms.handle} />
            <Text style={ms.title}>Select Teacher</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {teachers.length === 0 && (
                <Text style={{textAlign:'center',color:C.textLight,padding:20}}>
                  No teachers found. Create teachers in Users tab first.
                </Text>
              )}
              {teachers.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[ms.teacherRow,
                    ((showTeacherDD === true && addTeacher?.id === t.id) ||
                     (showTeacherDD === 'edit' && editTeacher?.id === t.id))
                    && ms.teacherRowSel]}
                  onPress={() => {
                    if (showTeacherDD === 'edit') setEditTeacher(t);
                    else                          setAddTeacher(t);
                    setShowTeacherDD(false);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={ms.teacherAv}>
                    <Text style={{fontSize:18}}>👩‍🏫</Text>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={ms.teacherName}>{t.name ?? t.full_name ?? 'Unknown'}</Text>
                    <Text style={ms.teacherEmail}>{t.email || ''}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <View style={{height:40}} />
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
const ClassesScreen = () => {
  const [view,           setView]          = useState('list');
  const [classes,        setClasses]       = useState([]);
  const [teachers,       setTeachers]      = useState([]);
  const [selectedClass,  setSelectedClass] = useState(null);
  const [detailTab,      setDetailTab]     = useState('students');
  const [classStudents,  setClassStudents] = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [refreshing,     setRefreshing]    = useState(false);
  const [searchQuery,    setSearchQuery]   = useState('');

  const [createClassModal, setCreateClassModal] = useState(false);
  const [addStudentModal,  setAddStudentModal]  = useState(false);
  const [excelInstructions,setExcelInstructions]= useState(false);

  const [excelStudents,  setExcelStudents] = useState([]);
  const [committing,     setCommitting]    = useState(false);

  const fetchAll = async () => {
    try {
      const [clSnap, uSnap] = await Promise.all([
        getDocs(query(collection(db,'classes'), orderBy('createdAt','desc'))),
        getDocs(collection(db,'users')),
      ]);
      const allUsers = uSnap.docs.map(d => ({id:d.id,...d.data()}));
      setClasses(clSnap.docs.map(d => ({id:d.id,...d.data()})));
      setTeachers(allUsers.filter(u => u.role === 'teacher'));
    } catch(e) {
      console.error('fetchAll error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(); }, []);

  const loadClassStudents = async (cls) => {
    try {
      const studentIds = cls.students ?? [];
      if (studentIds.length === 0) { setClassStudents([]); return; }
      const result = [];
      await Promise.all(
        studentIds.map(async (uid) => {
          try {
            const snap = await getDoc(doc(db,'users',uid));
            if (snap.exists()) result.push({id:snap.id,...snap.data()});
          } catch { /* skip missing */ }
        })
      );
      result.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
      setClassStudents(result);
    } catch(e) {
      console.error('loadClassStudents error:', e);
    }
  };

  const openClass = (cls) => {
    setSelectedClass(cls);
    setDetailTab('students');
    setView('detail');
    loadClassStudents(cls);
  };

  const handleCreateClass = async (name) => {
    try {
      const ref = await addDoc(collection(db,'classes'), {
        className: name,
        students: [],
        createdAt: serverTimestamp(),
      });
      setClasses(prev => [{id:ref.id, className:name, students:[], createdAt:new Date()}, ...prev]);
      setCreateClassModal(false);
      Alert.alert('✅ Created', `Class "${name}" created successfully!`);
    } catch(e) {
      Alert.alert('Error', 'Failed to create class.');
      console.error(e);
    }
  };

  // ── Add one student manually ──────────────────────────────────────────────
  // ── CHANGED: accepts and stores batch field ───────────────────────────────
  const handleAddStudent = async (studentData) => {
    try {
      const secondaryAuth = getSecondaryAuth();
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        studentData.email,
        DEFAULT_STUDENT_PASSWORD
      );
      const uid = credential.user.uid;
      await secondaryAuth.signOut();

      const userDoc = {
        name:               studentData.name,
        full_name:          studentData.name,
        email:              studentData.email,
        phone:              studentData.phone,
        roll_number:        studentData.roll_number,
        enrollment_number:  studentData.enrollment_number,
        parent_email:       studentData.parent_email,
        batch:              studentData.batch,   // ← NEW: store batch
        role:               'student',
        uid,
        createdAt:          serverTimestamp(),
      };
      await setDoc(doc(db,'users',uid), userDoc);

      await updateDoc(doc(db,'classes',selectedClass.id), {
        students: arrayUnion(uid),
      });

      const newStudent = {id:uid, ...userDoc, createdAt:new Date()};
      setClassStudents(prev => [...prev, newStudent]
        .sort((a,b)=>(a.name||'').localeCompare(b.name||'')));
      setSelectedClass(prev => ({
        ...prev,
        students: [...(prev.students||[]), uid],
      }));

      setAddStudentModal(false);
      Alert.alert('✅ Added', `${studentData.name} (${studentData.batch}) added to ${selectedClass.className}!`);
    } catch(e) {
      const msg =
        e.code === 'auth/email-already-in-use' ? 'This email is already registered.' :
        e.code === 'auth/invalid-email'         ? 'Invalid email address.' :
        `Failed to add student: ${e.message}`;
      Alert.alert('Error', msg);
      console.error(e);
    }
  };

  // ── Pick and parse Excel file ─────────────────────────────────────────────
  // ── CHANGED: parses batch column (required), skips rows with invalid batch ─
  const handleExcelPick = async () => {
    setExcelInstructions(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });

      const workbook  = xlsxRead(fileContent, { type: 'base64' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsxUtils.sheet_to_json(firstSheet);

      if (rows.length === 0) {
        Alert.alert('Empty File', 'No data found in the Excel file.');
        return;
      }

      // ── Helper: normalise batch value from Excel cell ──────────────────────
      // Accepts: "A", "a", "A batch", "Batch A", "batch a" → stores as "A"/"B"/"C"
      const normaliseBatch = (raw) => {
        const s = String(raw ?? '').trim().toUpperCase();
        if (s === 'A' || s === 'A BATCH' || s === 'BATCH A') return 'A';
        if (s === 'B' || s === 'B BATCH' || s === 'BATCH B') return 'B';
        if (s === 'C' || s === 'C BATCH' || s === 'BATCH C') return 'C';
        return s; // keep as-is so preview screen can flag it
      };

      const parsed = rows.map(row => ({
        name:               String(row['name']              ?? row['Name']              ?? '').trim(),
        email:              String(row['email']             ?? row['Email']             ?? '').trim().toLowerCase(),
        batch:              normaliseBatch(row['batch']     ?? row['Batch']             ?? ''),
        phone:              String(row['phone']             ?? row['Phone']             ?? '').trim(),
        roll_number:        String(row['roll_number']       ?? row['Roll Number']       ?? '').trim(),
        enrollment_number:  String(row['enrollment_number'] ?? row['Enrollment Number'] ?? '').trim(),
        parent_email:       String(row['parent_email']      ?? row['Parent Email']      ?? '').trim().toLowerCase(),
      })).filter(s => s.name && s.email);

      if (parsed.length === 0) {
        Alert.alert('No Valid Students',
          'Could not find any rows with both name and email. Check your column names.');
        return;
      }

      // Warn about invalid batches up front
      const invalidCount = parsed.filter(s => !BATCH_OPTIONS.includes(s.batch)).length;
      if (invalidCount > 0) {
        Alert.alert(
          '⚠️ Batch Issues Found',
          `${invalidCount} student${invalidCount>1?'s have':' has'} a missing or invalid batch value.\n\nYou can fix them in the preview screen before committing.`
        );
      }

      setExcelStudents(parsed);
      setView('excelPreview');

    } catch(e) {
      Alert.alert('Error', 'Failed to read Excel file. Make sure it is a valid .xlsx file.');
      console.error('Excel parse error:', e);
    }
  };

  // ── Commit Excel students to Firestore ────────────────────────────────────
  // ── CHANGED: includes batch in userDoc; skips students with invalid batch ─
  const handleExcelCommit = async (students) => {
    // Separate valid and invalid batch students
    const validStudents   = students.filter(s => BATCH_OPTIONS.includes(s.batch));
    const skippedBatch    = students.length - validStudents.length;

    if (validStudents.length === 0) {
      Alert.alert('Nothing to Commit',
        'All students have invalid or missing batch values. Please edit them first.');
      return;
    }

    setCommitting(true);
    let successCount = 0;
    let failCount    = 0;
    const newUids    = [];

    for (const student of validStudents) {
      try {
        const secondaryAuth = getSecondaryAuth();
        const credential = await createUserWithEmailAndPassword(
          secondaryAuth,
          student.email,
          DEFAULT_STUDENT_PASSWORD
        );
        const uid = credential.user.uid;
        await secondaryAuth.signOut();

        await setDoc(doc(db,'users',uid), {
          name:               student.name,
          full_name:          student.name,
          email:              student.email,
          batch:              student.batch,  // ← NEW: store batch
          phone:              student.phone || '',
          roll_number:        student.roll_number || '',
          enrollment_number:  student.enrollment_number || '',
          parent_email:       student.parent_email || '',
          role:               'student',
          uid,
          createdAt:          serverTimestamp(),
        });

        newUids.push(uid);
        successCount++;
      } catch(e) {
        failCount++;
        console.error(`Failed to create ${student.email}:`, e.message);
      }
    }

    if (newUids.length > 0) {
      try {
        await updateDoc(doc(db,'classes',selectedClass.id), {
          students: arrayUnion(...newUids),
        });
        await loadClassStudents({
          ...selectedClass,
          students: [...(selectedClass.students||[]), ...newUids],
        });
        setSelectedClass(prev => ({
          ...prev,
          students: [...(prev.students||[]), ...newUids],
        }));
      } catch(e) {
        console.error('arrayUnion error:', e);
      }
    }

    setCommitting(false);
    setView('detail');

    Alert.alert(
      '✅ Commit Complete',
      `${successCount} student${successCount!==1?'s':''} added successfully.` +
      (skippedBatch > 0 ? `\n${skippedBatch} skipped (invalid batch).` : '') +
      (failCount > 0    ? `\n${failCount} failed (email already in use or invalid).` : '')
    );
  };

  const handleDeleteStudent = (student) => {
    Alert.alert(
      'Delete Student',
      `Delete ${student.name} permanently?\n\nThis will:\n• Remove them from ${selectedClass?.className}\n• Delete their user account\n• Delete their attendance records\n\nThis cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              const uid = student.id;

              // Step 1: remove uid from class students array
              const updatedStudents = (selectedClass.students||[]).filter(id => id !== uid);
              await updateDoc(doc(db,'classes',selectedClass.id), {
                students: updatedStudents,
              });

              // Step 2: delete user doc
              await deleteDoc(doc(db,'users',uid));

              // Step 3: update UI
              setClassStudents(prev => prev.filter(s => s.id !== uid));
              setSelectedClass(prev => ({...prev, students: updatedStudents}));

              Alert.alert('✅ Deleted', `${student.name} has been deleted.`);
              // Note: Firebase Auth account deletion requires a Cloud Function.
            } catch(e) {
              Alert.alert('Error', 'Failed to delete student.');
              console.error(e);
            }
          },
        },
      ]
    );
  };

  const filteredClasses = classes.filter(c =>
    (c.className||c.name||'').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER: EXCEL PREVIEW SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'excelPreview') {
    return (
      <ExcelPreviewScreen
        students={excelStudents}
        onBack={() => setView('detail')}
        onCommit={handleExcelCommit}
        committing={committing}
      />
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER: CLASS DETAIL SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (view === 'detail' && selectedClass) {
    return (
      <View style={s.container}>
        <StatusBar barStyle="light-content" backgroundColor={C.primary} />
        <View style={s.detailHeader}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => { setView('list'); setSelectedClass(null); setClassStudents([]); }}
            activeOpacity={0.8}
          >
            <Text style={s.backBtnTxt}>‹</Text>
          </TouchableOpacity>
          <View style={{flex:1}}>
            <Text style={s.detailTitle}>{selectedClass.className || selectedClass.name}</Text>
            <Text style={s.detailSub}>
              🎓 {selectedClass.students?.length ?? 0} students
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={s.detailTabRow}>
          {[
            {key:'students', label:'👥 Students'},
            {key:'subjects', label:'📚 Subjects'},
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[s.detailTab, detailTab===tab.key && s.detailTabActive]}
              onPress={() => setDetailTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.detailTabTxt, detailTab===tab.key && s.detailTabTxtActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Students Tab ────────────────────────────────────────────── */}
        {detailTab === 'students' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{padding:16}}>
              <View style={s.addStudentRow}>
                <TouchableOpacity
                  style={[s.addStudentBtn, {backgroundColor:C.secondary}]}
                  onPress={() => setAddStudentModal(true)}
                  activeOpacity={0.85}
                >
                  <Text style={s.addStudentBtnTxt}>+ Add Student</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.addStudentBtn, {backgroundColor:C.success}]}
                  onPress={() => setExcelInstructions(true)}
                  activeOpacity={0.85}
                >
                  <Text style={s.addStudentBtnTxt}>📊 Excel Upload</Text>
                </TouchableOpacity>
              </View>

              <Text style={s.sectionLabel}>
                ENROLLED STUDENTS — {classStudents.length}
              </Text>

              {classStudents.length === 0 ? (
                <View style={s.emptyBox}>
                  <Text style={s.emptyEmoji}>🎓</Text>
                  <Text style={s.emptyTitle}>No Students Yet</Text>
                  <Text style={s.emptySub}>Add students using the buttons above</Text>
                </View>
              ) : (
                <View style={s.studentTable}>
                  {/* ── Table header — CHANGED: added Batch column ───────── */}
                  <View style={s.tableHeaderRow}>
                    <Text style={[s.tableHeaderCell, {width:40}]}>No.</Text>
                    <Text style={[s.tableHeaderCell, {flex:1}]}>Name</Text>
                    <Text style={[s.tableHeaderCell, {width:72, textAlign:'center'}]}>Batch</Text>
                    <Text style={[s.tableHeaderCell, {width:72, textAlign:'center'}]}>Roll No</Text>
                    <Text style={[s.tableHeaderCell, {width:36}]}></Text>
                  </View>

                  {classStudents.map((student, i) => (
                    <View
                      key={student.id}
                      style={[s.tableRow, i%2===1 && s.tableRowAlt]}
                    >
                      {/* Index */}
                      <View style={{width:40, alignItems:'center'}}>
                        <Text style={s.tableIndex}>{i+1}</Text>
                      </View>

                      {/* Name + email */}
                      <View style={{flex:1}}>
                        <Text style={s.tableStudentName} numberOfLines={1}>
                          {student.name || student.full_name || '—'}
                        </Text>
                        <Text style={s.tableStudentEmail} numberOfLines={1}>
                          {student.email || ''}
                        </Text>
                      </View>

                      {/* ── NEW: Batch column ─────────────────────────────── */}
                      <View style={{width:72, alignItems:'center'}}>
                        {student.batch
                          ? <BatchBadge batch={student.batch} small />
                          : <Text style={{fontSize:11, color:C.textLight}}>—</Text>
                        }
                      </View>

                      {/* Roll number */}
                      <View style={{width:72, alignItems:'center'}}>
                        <Text style={s.tableRollNo}>
                          {student.roll_number || '—'}
                        </Text>
                      </View>

                      {/* Delete */}
                      <TouchableOpacity
                        style={{width:36, alignItems:'center'}}
                        onPress={() => handleDeleteStudent(student)}
                        activeOpacity={0.7}
                      >
                        <Text style={{fontSize:16}}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              <View style={{height:40}} />
            </View>
          </ScrollView>
        )}

        {/* ── Subjects Tab ────────────────────────────────────────────── */}
        {detailTab === 'subjects' && (
          <ScrollView showsVerticalScrollIndicator={false}>
            <SubjectManager
              classId={selectedClass.id}
              className={selectedClass.className || selectedClass.name}
              teachers={teachers}
            />
          </ScrollView>
        )}

        <AddStudentModal
          visible={addStudentModal}
          onClose={() => setAddStudentModal(false)}
          onSave={handleAddStudent}
        />
        <ExcelInstructionsModal
          visible={excelInstructions}
          onClose={() => setExcelInstructions(false)}
          onProceed={handleExcelPick}
        />
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER: CLASS LIST SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.primary} />
      <View style={s.header}>
        <View style={s.hdrTop}>
          <View>
            <Text style={s.hdrTitle}>Classes</Text>
            <Text style={s.hdrSub}>{classes.length} class{classes.length!==1?'es':''} total</Text>
          </View>
          <TouchableOpacity
            style={s.hdrBtn}
            onPress={() => setCreateClassModal(true)}
            activeOpacity={0.8}
          >
            <Text style={s.hdrBtnTxt}>+ New Class</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{flex:1, paddingTop:16}}>
        <View style={s.searchWrap}>
          <View style={s.searchBar}>
            <Text style={s.searchIcon}>🔍</Text>
            <TextInput
              style={s.searchInput}
              placeholder="Search classes..."
              placeholderTextColor={C.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={s.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {!loading && (
          <Text style={s.metaTxt}>
            {filteredClasses.length} class{filteredClasses.length!==1?'es':''} found
          </Text>
        )}

        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={s.loaderTxt}>Loading classes...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredClasses}
            keyExtractor={item => item.id}
            contentContainerStyle={[
              s.list,
              filteredClasses.length === 0 && s.listEmpty,
            ]}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{height:12}} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing} onRefresh={onRefresh}
                colors={[C.primary]} tintColor={C.primary}
              />
            }
            ListEmptyComponent={
              <View style={s.emptyBox}>
                <Text style={s.emptyEmoji}>🏫</Text>
                <Text style={s.emptyTitle}>
                  {searchQuery ? 'No results found' : 'No classes yet'}
                </Text>
                <Text style={s.emptySub}>
                  {searchQuery ? 'Try a different search' : 'Tap + New Class to create your first class'}
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const color = classColor(item.id);
              const studentCount = item.students?.length ?? 0;
              return (
                <View style={s.classCard}>
                  <View style={[s.stripe, {backgroundColor:color}]} />
                  <View style={s.classCardBody}>
                    <View style={[s.classAv, {backgroundColor:color}]}>
                      <Text style={s.classAvTxt}>
                        {getInitials(item.className || item.name || '?')}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={{flex:1}}
                      onPress={() => openClass(item)}
                      activeOpacity={0.82}
                    >
                      <Text style={s.className} numberOfLines={1}>
                        {item.className || item.name}
                      </Text>
                      <Text style={s.classInfo}>
                        🎓 {studentCount} {studentCount===1?'student':'students'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.classDeleteBtn}
                      onPress={() => {
                        Alert.alert(
                          'Delete Class',
                          `Delete "${item.className || item.name}"?\n\nThis will also remove all subject assignments for this class. Student accounts will remain.`,
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete', style: 'destructive',
                              onPress: async () => {
                                try {
                                  const classId = item.id;
                                  const className = item.className || item.name;

                                  // Step 1: get student UIDs from class before deleting
                                  const classSnap = await getDoc(doc(db,'classes',classId));
                                  const studentUids = classSnap.exists()
                                    ? (classSnap.data().students ?? [])
                                    : [];

                                  // Step 2: delete class doc
                                  await deleteDoc(doc(db,'classes',classId));

                                  // Step 3: delete all class_subjects for this class
                                  const csSnap = await getDocs(collection(db,'class_subjects'));
                                  const relatedCS = csSnap.docs.filter(d => d.data().classId === classId);
                                  await Promise.all(relatedCS.map(d => deleteDoc(d.ref)));

                                  // Step 4: delete all attendance docs for this class
                                  const attSnap = await getDocs(collection(db,'attendance'));
                                  const relatedAtt = attSnap.docs.filter(d => d.data().classId === classId);
                                  await Promise.all(relatedAtt.map(d => deleteDoc(d.ref)));

                                  // Step 5: delete published_defaulters doc for this class
                                  try {
                                    await deleteDoc(doc(db,'published_defaulters',classId));
                                  } catch { /* may not exist, safe to ignore */ }

                                  // Step 6: delete all student users docs
                                  await Promise.all(
                                    studentUids.map(uid => deleteDoc(doc(db,'users',uid)).catch(() => {}))
                                  );
                                  // Note: Firebase Auth accounts for students are NOT deleted here.
                                  // Auth deletion requires a Cloud Function (deferred task).
                                  // Students will exist in Auth but have no Firestore doc.

                                  setClasses(prev => prev.filter(c => c.id !== classId));
                                  Alert.alert(
                                    '✅ Deleted',
                                    `Class "${className}" and all related data deleted.\n${studentUids.length} student account(s) removed.`
                                  );
                                } catch(e) {
                                  Alert.alert('Error', 'Failed to delete class.');
                                  console.error(e);
                                }
                              },
                            },
                          ]
                        );
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{fontSize:18}}>🗑️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openClass(item)} activeOpacity={0.82}>
                      <Text style={s.classArrow}>›</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      <TouchableOpacity
        style={s.fab}
        onPress={() => setCreateClassModal(true)}
        activeOpacity={0.85}
      >
        <Text style={s.fabIcon}>＋</Text>
      </TouchableOpacity>

      <CreateClassModal
        visible={createClassModal}
        onClose={() => setCreateClassModal(false)}
        onSave={handleCreateClass}
      />
    </View>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
//  STYLES
// ══════════════════════════════════════════════════════════════════════════════
const ms = StyleSheet.create({
  overlay:    { flex:1, backgroundColor:C.overlay, justifyContent:'flex-end' },
  sheet:      { backgroundColor:C.card, borderTopLeftRadius:28, borderTopRightRadius:28,
                paddingHorizontal:20, paddingTop:12 },
  handle:     { width:40, height:4, backgroundColor:C.border, borderRadius:2,
                alignSelf:'center', marginBottom:16 },
  hdrRow:     { flexDirection:'row', alignItems:'center', marginBottom:20, gap:12 },
  hdrIcon:    { width:44, height:44, borderRadius:14, backgroundColor:C.primaryLight,
                alignItems:'center', justifyContent:'center' },
  hdrIconTxt: { fontSize:22 },
  title:      { fontSize:19, fontWeight:'800', color:C.text, letterSpacing:-0.3, marginBottom:4 },
  subtitle:   { fontSize:12, color:C.textSec },
  closeBtn:   { width:32, height:32, borderRadius:10, backgroundColor:C.inputBg,
                alignItems:'center', justifyContent:'center' },
  closeTxt:   { fontSize:13, color:C.textSec, fontWeight:'700' },
  fGroup:     { marginBottom:16 },
  lbl:        { fontSize:14, fontWeight:'600', color:C.text, marginBottom:8 },
  req:        { color:C.danger },
  opt:        { color:C.textLight, fontWeight:'400', fontSize:12 },
  inRow:      { flexDirection:'row', alignItems:'center', backgroundColor:C.inputBg,
                borderRadius:14, paddingHorizontal:14, borderWidth:1.5, borderColor:C.border },
  inIcon:     { fontSize:15, marginRight:10 },
  input:      { flex:1, fontSize:15, color:C.text, paddingVertical:13 },
  saveBtn:    { borderRadius:16, paddingVertical:15, alignItems:'center', marginTop:8,
                shadowOffset:{width:0,height:4}, shadowOpacity:0.25, shadowRadius:10, elevation:5 },
  saveBtnOff: { opacity:0.65 },
  saveBtnTxt: { color:'#fff', fontSize:15, fontWeight:'700', letterSpacing:0.3 },
  infoBox:    { backgroundColor:C.warningLight, borderRadius:12, padding:12,
                borderWidth:1, borderColor:C.warning, marginBottom:12 },
  infoTxt:    { fontSize:12, color:C.text, lineHeight:18 },
  colRow:     { flexDirection:'row', alignItems:'flex-start', gap:10,
                marginBottom:10, paddingVertical:4 },
  colBadge:   { borderRadius:8, paddingHorizontal:8, paddingVertical:3,
                minWidth:64, alignItems:'center' },
  colBadgeTxt:{ fontSize:10, fontWeight:'800' },
  colName:    { fontSize:14, fontWeight:'700', color:C.text, fontFamily:'monospace' },
  colDesc:    { fontSize:11, color:C.textSec, marginTop:1 },
  teacherRow: { flexDirection:'row', alignItems:'center', padding:12, borderRadius:12,
                marginBottom:8, backgroundColor:C.inputBg, borderWidth:1.5,
                borderColor:'transparent', gap:12 },
  teacherRowSel: { backgroundColor:C.primaryLight, borderColor:C.primary },
  teacherAv:  { width:36, height:36, borderRadius:10, backgroundColor:C.primaryLight,
                alignItems:'center', justifyContent:'center' },
  teacherName:{ fontSize:14, fontWeight:'600', color:C.text },
  teacherEmail:{ fontSize:12, color:C.textSec, marginTop:1 },
});

const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:C.bg },

  header:     { backgroundColor:C.primary, paddingTop:52, paddingHorizontal:20,
                paddingBottom:20, borderBottomLeftRadius:28, borderBottomRightRadius:28 },
  hdrTop:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  hdrTitle:   { fontSize:22, fontWeight:'800', color:'#fff', letterSpacing:-0.3 },
  hdrSub:     { fontSize:13, color:'rgba(255,255,255,0.7)', marginTop:2 },
  hdrBtn:     { backgroundColor:'rgba(255,255,255,0.22)', borderRadius:20,
                paddingVertical:8, paddingHorizontal:16, borderWidth:1.5,
                borderColor:'rgba(255,255,255,0.35)' },
  hdrBtnTxt:  { color:'#fff', fontWeight:'700', fontSize:14 },

  searchWrap: { paddingHorizontal:18, marginBottom:10 },
  searchBar:  { flexDirection:'row', alignItems:'center', backgroundColor:C.card,
                borderRadius:16, paddingHorizontal:14, paddingVertical:12,
                elevation:3, borderWidth:1, borderColor:C.border },
  searchIcon: { fontSize:16, marginRight:10 },
  searchInput:{ flex:1, fontSize:15, color:C.text },
  clearIcon:  { fontSize:14, color:C.textLight, paddingLeft:8 },
  metaTxt:    { fontSize:13, color:C.textSec, paddingHorizontal:20, marginBottom:10 },

  list:       { paddingHorizontal:18, paddingBottom:100 },
  listEmpty:  { flex:1 },
  loader:     { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  loaderTxt:  { fontSize:14, color:C.textSec },

  classCard:  { backgroundColor:C.card, borderRadius:18, overflow:'hidden',
                elevation:3, shadowColor:'#000', shadowOffset:{width:0,height:2},
                shadowOpacity:0.07, shadowRadius:8 },
  stripe:     { height:5 },
  classCardBody: { flexDirection:'row', alignItems:'center', padding:16 },
  classAv:    { width:48, height:48, borderRadius:14, alignItems:'center',
                justifyContent:'center', marginRight:14 },
  classAvTxt: { color:'#fff', fontWeight:'800', fontSize:16 },
  className:  { fontSize:17, fontWeight:'700', color:C.text },
  classInfo:  { fontSize:13, color:C.textSec, marginTop:3 },
  classArrow:     { fontSize:28, color:C.textLight, marginLeft:4 },
  classDeleteBtn: { width:36, height:36, borderRadius:10,
                    backgroundColor:C.dangerLight,
                    alignItems:'center', justifyContent:'center',
                    marginLeft:8 },

  detailHeader: { backgroundColor:C.primary, paddingTop:52, paddingHorizontal:16,
                  paddingBottom:18, flexDirection:'row', alignItems:'center', gap:12 },
  backBtn:    { width:40, height:40, borderRadius:20,
                backgroundColor:'rgba(255,255,255,0.2)',
                alignItems:'center', justifyContent:'center',
                borderWidth:1.5, borderColor:'rgba(255,255,255,0.35)' },
  backBtnTxt: { color:'#fff', fontSize:26, fontWeight:'300', lineHeight:30 },
  detailTitle:{ fontSize:20, fontWeight:'800', color:'#fff' },
  detailSub:  { fontSize:13, color:'rgba(255,255,255,0.7)', marginTop:2 },

  detailTabRow:  { flexDirection:'row', marginHorizontal:16, marginVertical:14, gap:10 },
  detailTab:     { flex:1, paddingVertical:11, borderRadius:13, alignItems:'center',
                   backgroundColor:C.card, borderWidth:1.5, borderColor:C.border },
  detailTabActive:{ backgroundColor:C.primary, borderColor:C.primary },
  detailTabTxt:  { fontSize:13, fontWeight:'700', color:C.textSec },
  detailTabTxtActive: { color:'#fff' },

  addStudentRow: { flexDirection:'row', gap:10, marginBottom:16 },
  addStudentBtn: { flex:1, paddingVertical:13, borderRadius:14,
                   alignItems:'center', elevation:3,
                   shadowOffset:{width:0,height:2}, shadowOpacity:0.2, shadowRadius:6 },
  addStudentBtnTxt: { color:'#fff', fontWeight:'700', fontSize:14 },

  sectionLabel: { fontSize:11, fontWeight:'800', color:C.textLight,
                  letterSpacing:1, textTransform:'uppercase', marginBottom:10 },

  studentTable:  { backgroundColor:C.card, borderRadius:16, overflow:'hidden',
                   marginBottom:14, elevation:2 },
  tableHeaderRow:{ flexDirection:'row', alignItems:'center',
                   backgroundColor:C.primary, paddingVertical:10, paddingHorizontal:8 },
  tableHeaderCell:{ fontSize:11, fontWeight:'800', color:'#fff',
                    textTransform:'uppercase', letterSpacing:0.5 },
  tableRow:      { flexDirection:'row', alignItems:'center',
                   paddingVertical:12, paddingHorizontal:8,
                   borderBottomWidth:1, borderBottomColor:C.bg },
  tableRowAlt:   { backgroundColor:'#FAFBFC' },
  tableIndex:    { fontSize:13, fontWeight:'700', color:C.textLight },
  tableStudentName:  { fontSize:14, fontWeight:'600', color:C.text },
  tableStudentEmail: { fontSize:12, color:C.textSec, marginTop:1 },
  tableRollNo:   { fontSize:13, fontWeight:'600', color:C.primary },

  subAddCard:  { backgroundColor:C.card, borderRadius:16, padding:16,
                 marginBottom:16, elevation:2 },
  subAddTitle: { fontSize:15, fontWeight:'700', color:C.text },
  subjectRow:  { flexDirection:'row', alignItems:'center',
                 backgroundColor:C.card, borderRadius:14,
                 padding:14, marginBottom:10, elevation:2,
                 shadowColor:'#000', shadowOffset:{width:0,height:1},
                 shadowOpacity:0.05, shadowRadius:4, gap:10 },
  subjectIconBox: { width:40, height:40, borderRadius:12,
                    alignItems:'center', justifyContent:'center' },
  subjectName:    { fontSize:15, fontWeight:'700', color:C.text },
  subjectTeacher: { fontSize:13, color:C.textSec, marginTop:2 },
  subjectAction:  { width:34, height:34, borderRadius:10,
                    alignItems:'center', justifyContent:'center' },

  previewCard:     { backgroundColor:C.card, borderRadius:14, padding:14,
                     marginBottom:10, elevation:2 },
  previewRow:      { flexDirection:'row', alignItems:'center', gap:12 },
  previewAvatar:   { width:40, height:40, borderRadius:12,
                     alignItems:'center', justifyContent:'center' },
  previewAvatarTxt:{ color:'#fff', fontWeight:'800', fontSize:14 },
  previewName:     { fontSize:14, fontWeight:'700', color:C.text },
  previewEmail:    { fontSize:12, color:C.textSec, marginTop:1 },
  previewMeta:     { fontSize:11, color:C.primary, marginTop:1 },
  previewEditTitle:{ fontSize:14, fontWeight:'700', color:C.text, marginBottom:10 },
  previewEditRow:  { marginBottom:10 },
  previewEditLabel:{ fontSize:12, fontWeight:'600', color:C.textSec, marginBottom:4 },
  previewEditInput:{ backgroundColor:C.inputBg, borderRadius:10, paddingHorizontal:12,
                     paddingVertical:10, fontSize:14, color:C.text,
                     borderWidth:1.5, borderColor:C.border },
  previewAction:   { width:34, height:34, borderRadius:10,
                     alignItems:'center', justifyContent:'center' },

  emptyBox:   { alignItems:'center', paddingVertical:48, paddingHorizontal:32 },
  emptyEmoji: { fontSize:48, marginBottom:12 },
  emptyTitle: { fontSize:17, fontWeight:'700', color:C.text, marginBottom:6 },
  emptySub:   { fontSize:13, color:C.textSec, textAlign:'center', lineHeight:20 },

  fab:        { position:'absolute', bottom:28, right:22,
                width:58, height:58, borderRadius:20,
                backgroundColor:C.primary, alignItems:'center', justifyContent:'center',
                shadowColor:C.primary, shadowOffset:{width:0,height:6},
                shadowOpacity:0.4, shadowRadius:14, elevation:10 },
  fabIcon:    { color:'#fff', fontSize:28, fontWeight:'300', lineHeight:32 },
});

export default ClassesScreen;